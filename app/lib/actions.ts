'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { State } from '@/app/lib/definitions';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const formSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer'
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter a amount more than $0' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status'
    }),
    date: z.string(),
});

const CreateInvoice = formSchema.omit({ id: true, date: true });
const UpdateInvoice = formSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to create Invoice',
        };
    }

    const { customerId, amount, status } = validatedFields.data;

    const createdAt = new Date().toISOString().split('T')[0];
    const priceInCents = Math.round(amount * 100);

    try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${priceInCents}, ${status}, ${createdAt})
    `; } catch (error) {
    console.error(error);
    return { message: 'Error creating invoice' };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
    const updatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!updatedFields.success) {
        return {
            errors: updatedFields.error.flatten().fieldErrors,
            message: 'Failed to update invoice',
        }
    }

    const { customerId, amount, status } = updatedFields.data;
    const priceInCents = Math.round(amount * 100);

    try {
    await sql`
    UPDATE invoices 
    SET customer_id = ${customerId}, amount = ${priceInCents}, status = ${status}
    WHERE id = ${id}`; } catch (error) {
        console.error(error);
        return { message: 'Error updating invoice' };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
    await sql`DELETE FROM invoices WHERE id = ${id}`; } catch (error) {
        console.error(error);
        return;
    }
    revalidatePath('/dashboard/invoices');
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}