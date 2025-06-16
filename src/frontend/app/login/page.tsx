import Background from '@/components/background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <Background>
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="email" className="pb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="pb-2">
                  Passwort
                </Label>
                <Input id="password" type="password" placeholder="" required />
              </div>
              <Button type="submit" className="w-full">
                Einloggen
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between text-sm text-muted-foreground">
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
