'use client'

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
import { LoggedInCard } from '@/components/user/logged-in-card'
import FinAppLogo from '@/components/nav/finapp-logo'

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
      router.push('/overview')
    },
    onError: () => {
      toast.error('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.')
    },
  })

  function onSubmit(values: z.infer<typeof loginModel>) {
    mutate(values)
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-center items-center px-4 min-h-screen">
        <Card className="shadow-xl w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              <div className="flex justify-center items-center">
                <FinAppLogo className="text-2xl" />
              </div>
              <div className="text-2xl text-center">Anmelden</div>
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

          <CardFooter className="flex flex-col gap-2">
            <LoggedInCard className="w-full" />
            <div className="flex justify-between w-full text-muted-foreground text-sm">
              <span>Noch kein Konto?</span>
              <Link href="/register" className="text-primary hover:underline">
                Registrieren
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
