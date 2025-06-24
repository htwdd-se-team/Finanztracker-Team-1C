'use client'

import Background from '@/components/background'
import Logo from '@/components/linked-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { apiClient, apiSetToken } from '@/api/api-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { ApiLoginDto } from '@/__generated__/api'

const loginModel = z.object({
  email: z.string().email({
    message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  }),
  password: z.string().min(8, {
    message: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
  }),
}) satisfies z.ZodType<ApiLoginDto>

export default function LoginPage() {
  const router = useRouter()

  const form = useForm<z.infer<typeof loginModel>>({
    resolver: zodResolver(loginModel),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async (values: z.infer<typeof loginModel>) =>
      (await apiClient.auth.authControllerLogin(values)).data,
    onSuccess: data => {
      apiSetToken(data.token)
      toast.success('Login erfolgreich')
      router.push('/')
    },
    onError: () => {
      toast.error('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.')
    },
  })

  function onSubmit(values: z.infer<typeof loginModel>) {
    mutate(values)
  }

  return (
    <Background>
      <div className="flex justify-center items-center px-4 min-h-screen">
        <Card className="shadow-xl w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Bei <Logo className="text-2xl" /> anmelden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="gap-4 grid"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="gap-2 grid">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="gap-2 grid">
                      <FormLabel>Passwort</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  )}
                  Einloggen
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between text-muted-foreground text-sm">
            <span>Noch kein Konto?</span>
            <Link href="/register" className="text-primary hover:underline">
              Registrieren
            </Link>
          </CardFooter>
        </Card>
      </div>
    </Background>
  )
}
