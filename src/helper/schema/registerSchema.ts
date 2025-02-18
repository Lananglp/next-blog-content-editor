import * as z from 'zod'

export const registerSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi").max(25, "Nama maksimal 25 karakter"),
    email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
    password: z
        .string()
        .min(1, "Password wajib diisi")
        .min(8, "Password minimal 8 karakter")
        .max(32, "Password maksimal 32 karakter")
        .regex(/[a-z]/, "Password harus mengandung huruf kecil")
        .regex(/[A-Z]/, "Password harus mengandung huruf besar")
        .regex(/[0-9]/, "Password harus mengandung angka")
        .regex(/[\W_]/, "Password harus mengandung karakter spesial"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
});