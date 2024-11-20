'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { neon } from '@neondatabase/serverless'
import { compare, hash } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { cookies } from 'next/headers'

// Server actions
async function loginUser(email: string, password: string) {
    'use server'
    const sql = neon(process.env.DATABASE_URL!)
    const user = await sql`SELECT * FROM users WHERE email = ${email}`

    if (user && user.length > 0) {
        const passwordMatch = await compare(password, user[0].password)
        if (passwordMatch) {
            const token = sign({ userId: user[0].id }, process.env.JWT_SECRET!, { expiresIn: '1h' })
            const cookie = await cookies();
            cookie.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }); return { success: true, user: { id: user[0].id, email: user[0].email } }
        }
    }

    return { success: false, error: 'Invalid credentials' }
}

async function registerUser(email: string, password: string, acceptedTerms: boolean) {
    'use server'
    if (!acceptedTerms) {
        return { success: false, error: 'You must accept the terms and conditions' }
    }

    const sql = neon(process.env.DATABASE_URL!)
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`

    if (existingUser && existingUser.length > 0) {
        return { success: false, error: 'User already exists' }
    }

    const hashedPassword = await hash(password, 10)
    const newUser = await sql`INSERT INTO users (email, password) VALUES (${email}, ${hashedPassword}) RETURNING id, email`

    const token = sign({ userId: newUser[0].id }, process.env.JWT_SECRET!, { expiresIn: '1h' })
    const cookie = await cookies();
    cookie.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return { success: true, user: { id: newUser[0].id, email: newUser[0].email } }
}

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (isRegistering) {
            const result = await registerUser(email, password, acceptedTerms)
            if (result.success) {
                router.push('/')
            } else {
                setError(result.error ?? '');            }
        } else {
            const result = await loginUser(email, password)
            if (result.success) {
                router.push('/')
            } else {
                setError(result.error ?? '');            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isRegistering ? 'Register' : 'Login'}</CardTitle>
                    <CardDescription>
                        {isRegistering ? 'Create a new account' : 'Enter your credentials to access your account'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {isRegistering && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={acceptedTerms}
                                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                                />
                                <Label htmlFor="terms">I accept the terms and conditions</Label>
                            </div>
                        )}
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full">
                            {isRegistering ? 'Register' : 'Login'}
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="w-full"
                        >
                            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}