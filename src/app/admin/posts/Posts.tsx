'use client'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deletePosts } from '@/app/api/function/posts'
import FilterDataPerPage from '@/components/filter/data-per-page'
import InputSearch from '@/components/input/input-search'
import { Pagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { setTitle } from '@/context/titleSlice'
import { formatDateTime } from '@/helper/helper'
import { useFetchPosts } from '@/hooks/use-fetch-posts'
import { CheckIcon, CopyIcon, EditIcon, ImageOffIcon, LinkIcon, PenLine, SearchIcon, TrashIcon, UserRoundIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useClipboard, useMediaQuery, useSingleEffect } from 'react-haiku'
import { useDispatch } from 'react-redux'
import { useToast } from "@/hooks/use-toast"
import { AxiosError } from "axios"
import { responseStatus } from "@/helper/system-config"
import { SelectedType } from "@/types/all-type"

function Posts() {

    const dispatch = useDispatch();
    
    const setPageTitle = (title: string) => {
        dispatch(setTitle(title));
    }
    
    useSingleEffect(() => {
        setPageTitle('Manage your posts');
    });
    
    const origin = process.env.NEXT_PUBLIC_API_URL;
    const navigate = useRouter();
    const breakpoint = useMediaQuery('(min-width: 1280px)', true);
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const { posts, loading, error, reload } = useFetchPosts(page, limit, search);
    const [selectedPosts, setSelectedPosts] = useState<SelectedType>([]);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const items = posts?.items || [];

    const toggleSelection = (id: string, title: string) => {
        setSelectedPosts((prev) =>
            prev.some((post) => post.id === id)
                ? prev.filter((post) => post.id !== id)
                : [...prev, { id, title }]
        );
    };

    const toggleAllSelection = (items: SelectedType) => {
        if (selectedPosts.length === items.length) {
            setSelectedPosts([]);
        } else {
            setSelectedPosts(items);
        }
    };

    const handleDeleteSelectedPosts = async () => {
        if (selectedPosts.length === 0) return;

        // const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedPosts.length} posts?`);
        // if (!confirmDelete) return;

        try {
            const idsToDelete = selectedPosts.map((post) => post.id);
            const res = await deletePosts(idsToDelete);

            if (res.data.status === responseStatus.success) {
                reload();
                setSelectedPosts([]);
                toast({
                    title: res.data.status,
                    description: res.data.message,
                })   
            }
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                console.log(error.response);
                toast({
                    title: "Ops...",
                    description: `${error.response?.data?.message}. (${error.response?.status.toString()})` || "Terjadi kesalahan",
                })
            } else {
                console.log("Unknown error:", error);
            }
        }
    };

    const handlePageChange = (value: number) => {
        setPage(value);
        setSelectedPosts([]);
    }

    return (
        <div className='grid grid-cols-1 gap-4'>
            <div className='flex flex-col lg:flex-row justify-between gap-2'>
                <div>
                    <Button type='button' onClick={() => navigate.push('/admin/posts/create')} variant={'primary'} className='w-full'><PenLine />Create new post</Button>
                </div>
                <div className='flex flex-col lg:flex-row items-center gap-2'>
                    <FilterDataPerPage
                        value={limit}
                        onValueChange={(value) => setLimit(value)}
                        className="w-full lg:w-48"
                    />
                    <div className='w-full lg:w-80'>
                        <InputSearch placeholder='Search ...' onSearch={(value) => setSearch(value)} className='w-full' />
                    </div>
                </div>
            </div>
            <div className='grid grid-cols-12 gap-2'>
                {breakpoint && selectedPosts.length > 0 && (
                    <div className={`col-span-3 `}>
                        <div className='sticky top-[11rem] min-h-[calc(100vh-12.1rem)] flex flex-col bg-zinc-100 dark:bg-zinc-950/50 border border-template rounded-lg'>
                            <div className='sticky top-0 bg-zinc-100 dark:bg-zinc-950 flex justify-between items-center border-b border-template gap-1 p-2'>
                                <p className='p-2 text-sm'>{selectedPosts.length} selected</p>
                                <Button type='button' onClick={() => setSelectedPosts([])} variant={'transparent'} size={'iconSm'}><XIcon /></Button>
                            </div>
                            <div className="flex-grow max-h-[calc(100vh-19rem)] overflow-y-auto">
                                {selectedPosts.map((post, index) => (
                                    <div
                                        key={post.id}
                                        className={`flex justify-between items-center border-b border-template p-2
                                            ${hoveredId === post.id && selectedPosts.some((item) => item.id === post.id) ? 'bg-zinc-200/75 dark:bg-zinc-800' : ''}`}
                                        onMouseEnter={() => setHoveredId(post.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    >
                                        <p className='w-full text-sm line-clamp-2 ps-2'>{index + 1}.&nbsp;{post.title}</p>
                                        <Button type='button' onClick={() => toggleSelection(post.id, post.title || '')} variant={'transparent'} size={'iconSm'}>
                                            <XIcon />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className='sticky bottom-0 flex items-center gap-2 p-2'>
                                <Button type='button' disabled={selectedPosts.length > 1} variant={'primary'} size={'sm'} className='w-full'><EditIcon />Edit</Button>
                                <AlertDelete totalSelected={selectedPosts.length} onConfirm={handleDeleteSelectedPosts} disabled={selectedPosts.length === 0} className="w-full" />
                            </div>
                        </div>
                    </div>
                )}
                <div className={`${breakpoint && selectedPosts.length > 0 ? 'col-span-9' : 'col-span-12'} space-y-4`}>
                    {!breakpoint && selectedPosts.length > 0 && (
                        <div className='sticky top-4 z-10 flex flex-wrap lg:flex-nowrap justify-between items-center gap-2 bg-zinc-200 dark:bg-zinc-900 border border-template rounded-lg px-4 py-2'>
                            <p className='text-sm'>{selectedPosts.length} selected</p>
                            <div className='flex items-center gap-1'>
                                <Button type='button' disabled={selectedPosts.length > 1} variant={'primary'} size={'sm'}><EditIcon />Edit</Button>
                                <AlertDelete totalSelected={selectedPosts.length} onConfirm={handleDeleteSelectedPosts} disabled={selectedPosts.length === 0} />
                                <Button type='button' onClick={() => setSelectedPosts([])} variant={'transparent'} size={'iconSm'}><XIcon /></Button>
                            </div>
                        </div>
                    )}
                    <Pagination currentPage={page} totalData={posts?.pagination?.total || 0} dataPerPage={limit} onPageChange={(value) => handlePageChange(value)} />
                    <div className="overflow-x-auto focus:outline focus:outline-1 focus:outline-blue-500">
                        <table className='w-full'>
                            <thead>
                                <tr>
                                    <th className='px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-center'>
                                        <div className='flex items-center'>
                                            <Checkbox
                                                checked={selectedPosts.length === items.length && items.length > 0}
                                                onClick={() => toggleAllSelection(items)}
                                                variant={'primary'}
                                            />
                                        </div>
                                    </th>
                                    <th className='px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-center'>No</th>
                                    <th className='px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-center'>Thumbnail</th>
                                    <th className='min-w-96 px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-start'>Title</th>
                                    <th className='min-w-96 px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-start'>Summary</th>
                                    <th className='min-w-64 px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-start'>Author</th>
                                    <th className='min-w-72 px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-start'>Category</th>
                                    <th className='px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-start'>Link</th>
                                    <th className='px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-start'>Created At</th>
                                    <th className='px-4 py-2 border-b border-template text-zinc-500 dark:text-zinc-400 text-sm font-medium text-nowrap text-start'>Updated At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length > 0 ?
                                    items.map((post, index) => {
                                        return (
                                            <tr
                                                key={index}
                                                className={`${hoveredId === post.id && selectedPosts.some((item) => item.id === post.id) ? 'bg-zinc-200/75 dark:bg-zinc-900/75' : 'hover:bg-zinc-200/75 dark:hover:bg-zinc-900/75'}`}
                                                onMouseEnter={() => setHoveredId(post.id)}
                                                onMouseLeave={() => setHoveredId(null)}
                                            >
                                                <td className='p-4 border-b border-template text-center'>
                                                    <div className='flex items-center'>
                                                        <Checkbox
                                                            checked={selectedPosts.map((item) => item.id).includes(post.id)}
                                                            onClick={() => toggleSelection(post.id, post.title)}
                                                            variant={'primary'}
                                                        />
                                                    </div>
                                                </td>
                                                <td className='p-4 border-b border-template text-center'>{(page - 1) * limit + index + 1}</td>
                                                <td className='p-1 border-b border-template text-center'>
                                                    {post?.featuredImage && <Thumbnail key={post?.id} url={post?.featuredImage} />}
                                                </td>
                                                <td className='p-4 border-b border-template text-start'>
                                                    <div className='line-clamp-3'>
                                                        {post?.title}
                                                    </div>
                                                </td>
                                                <td className='p-4 border-b border-template text-start'>
                                                    <div className='line-clamp-2 text-sm'>
                                                        {post?.excerpt}
                                                    </div>
                                                </td>
                                                <td className='p-4 border-b border-template text-start'>
                                                    <div className='line-clamp-3 text-sm font-medium text-black dark:text-white'>
                                                        <UserRoundIcon className='inline h-4 w-4 mb-0.5 me-1' />{post?.author?.name}
                                                    </div>
                                                </td>
                                                <td className='p-4 border-b border-template text-start'>
                                                    <div className='line-clamp-3 flex flex-wrap flex- items-center gap-1'>
                                                        {/* {post?.categories?.slice(0, 5).map((category: string, index: number) => {
                                                            return (
                                                                <div key={index} className='bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 px-2 py-1 rounded-md text-xs font-medium'>
                                                                    {category}
                                                                </div>
                                                            )
                                                        })}
                                                        {post?.categories?.length > 5 && (
                                                            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                                +{post.categories.length - 5}
                                                            </div>
                                                        )} */}
                                                    </div>
                                                </td>
                                                <td className='p-4 border-b border-template text-start'>
                                                    {/* <PostLink origin={origin} post={post} /> */}
                                                </td>
                                                <td className='p-4 border-b border-template text-start text-nowrap text-sm text-zinc-500'>{post?.createdAt ? formatDateTime(post?.createdAt.toString()) : ''}</td>
                                                <td className='p-4 border-b border-template text-start text-nowrap text-sm text-zinc-500'>{post?.updatedAt !== post?.createdAt ? formatDateTime(post?.updatedAt.toString()) : '-'}</td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={9} className='p-4 border-b border-template text-center text-sm font-medium text-zinc-500 dark:text-zinc-400'>
                                                No data found
                                            </td>
                                        </tr>
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={page} totalData={posts?.pagination?.total || 0} dataPerPage={limit} onPageChange={(value) => handlePageChange(value)} />
                </div>
            </div>
        </div>
    )
}

const Thumbnail = ({ url }: { url: any }) => {

    const [valid, setValid] = useState(true);

    if (!url) {
        return (
            <div className='relative aspect-video object-cover bg-zinc-200/50 dark:bg-zinc-900/50 text-zinc-500 rounded border border-template' >
                <ImageOffIcon className='absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5' />
            </div>
        );
    }

    return (
        <div>
            {valid ? (
                <Image src={url} width={72} height={36} onError={() => setValid(false)} alt="thumbnail" className='aspect-video w-full h-full object-cover rounded border border-template' />
            ) :(
                <div className='relative aspect-video object-cover bg-zinc-200/50 dark:bg-zinc-900/50 text-zinc-500 rounded border border-template' >
                    <ImageOffIcon className='absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5' />
                </div>
            )}
        </div>
    );
};

const PostLink = ({ origin, post }: { origin: string | undefined, post: any }) => {

    const clipboard = useClipboard({ timeout: 2000 });

    return (
        <div className='group flex items-center gap-1'>
            <div className='max-w-80 truncate text-nowrap text-sm'>
                <Link href={`${origin}/${post?.categories[0]}/${post.slug}`}><LinkIcon className='inline h-4 w-4 mb-0.5 me-2' />{origin}/{post?.categories[0]}/{post.slug}</Link>
            </div>
            <Button type='button' onClick={() => clipboard.copy(`${origin}/${post?.categories[0]}/${post.slug}`)} className='group-hover:opacity-100 opacity-0' variant={'transparent'} size={'iconXs'}>{clipboard.copied ? <CheckIcon /> : <CopyIcon />}</Button>
        </div>
    );
};

type AlertDeleteProps = {
    onConfirm: () => void;
    disabled?: boolean;
    totalSelected: number;
    className?: string;
}

function AlertDelete({ onConfirm, disabled, totalSelected=0, className }: AlertDeleteProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button type='button' disabled={disabled} variant={'destructive'} size={'sm'} className={className}><TrashIcon />Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{totalSelected} selected posts will be deleted, are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This action will permanently delete your post and delete post data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default Posts