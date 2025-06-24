'use client'

import Background from '@/components/background'
import Logo from '@/components/linked-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiClient, apiSetToken } from '@/api/api-client'
import { useMutation } from '@tanstack/react-query'
import { ApiRegisterDto } from '@/__generated__/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

const registerModel = z.object({
  email: z.string().email({
    message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  }),
  givenName: z.string().nonempty({
    message: 'Bitte geben Sie Ihren Vornamen ein.',
  }),
  familyName: z.string().optional(),
  password: z.string().min(8, {
    message: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
  }),
  acceptTerms: z.boolean().refine(val => val, {
    message: 'Sie müssen die Nutzungsbedingungen akzeptieren.',
  }),
}) satisfies z.ZodType<ApiRegisterDto & { acceptTerms: boolean }>

export default function RegisterPage() {
  const form = useForm<z.infer<typeof registerModel>>({
    resolver: zodResolver(registerModel),
    defaultValues: {
      email: '',
      password: '',
      acceptTerms: false,
    },
  })

  const router = useRouter()

  const { mutate, isPending } = useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: async (values: ApiRegisterDto) =>
      (await apiClient.auth.authControllerRegister(values)).data,
    onSuccess: data => {
      toast.success('Konto erfolgreich erstellt')
      apiSetToken(data.token)
      router.push('/login')
    },
  })

  function onSubmit(values: z.infer<typeof registerModel>) {
    mutate({
      email: values.email,
      givenName: values.givenName,
      familyName: values.familyName,
      password: values.password,
    })
  }

  return (
    <Background>
      <div className="flex justify-center items-center px-4 min-h-screen">
        <Card className="shadow-xl w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Ein <Logo /> Konto erstellen
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
                    <FormItem>
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
                  name="givenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Max"
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
                  name="familyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nachname
                        <span className="text-muted-foreground text-xs">
                          Optional
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Mustermann"
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
                    <FormItem>
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
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="gap-2 grid">
                      <div className="flex flex-row items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm cursor-pointer">
                          Ich stimme den{' '}
                          <Button variant="link" className="p-0 h-auto" asChild>
                            <Link href="/legal/terms">Nutzungsbedingungen</Link>
                          </Button>{' '}
                          zu.
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  )}
                  Registrieren
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-between text-muted-foreground text-sm">
            <span>Schon registriert?</span>
            <Link href="/login" className="text-primary hover:underline">
              Einloggen
            </Link>
          </CardFooter>
        </Card>
      </div>
    </Background>
  )
}
