'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser } from '@/app/actions/userActions'
import { loginUser } from '@/app/actions/userActions'

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

        try {
            if (isRegistering) {
                const result = await registerUser(email, password, acceptedTerms)
                if (result.success) {
                    router.push('/')
                } else {
                    setError(result.error ?? 'No se pudo registrar')
                }
            } else {
                const result = await loginUser(email, password)
                if (result.success) {
                    router.push('/')
                } else {
                    setError(result.error ?? 'No se pudo iniciar sesión')
                }
            }
            //eslint-disable-next-line
        } catch (err) {
            setError('Ocurrió un error inesperado')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isRegistering ? 'Registro' : 'Iniciar sesión'}</CardTitle>
                    <CardDescription>
                        {isRegistering ? 'Crear una nueva cuenta' : 'Ingrese sus credenciales para acceder a su cuenta'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Ingrese su correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Ingrese su contraseña"
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
                                <Label htmlFor="terms">Acepto los términos y condiciones</Label>
                            </div>
                        )}
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full">
                            {isRegistering ? 'Registrarse' : 'Iniciar sesión'}
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="w-full"
                        >
                            {isRegistering ? 'Ya tengo una cuenta, iniciar sesión' : "No tengo una cuenta, registrarme"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
