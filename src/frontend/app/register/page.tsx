import Background from '@/components/background'
import Logo from '@/components/linked-logo'
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

export default function RegisterPage() {
  return (
    <Background>
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Ein <Logo /> Konto erstellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="firstname" className="pb-2">
                  Vorname
                </Label>
                <Input id="firstname" type="text" placeholder="Max" required />
              </div>
              <div>
                <Label htmlFor="lastname" className="pb-2">
                  Nachname (optional)
                </Label>
                <Input id="lastname" type="text" placeholder="Mustermann" />
              </div>
              <div>
                <Label htmlFor="email" className="pb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Max.Mustermann@gmail.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="pb-2">
                  Passwort
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder=""
                  required
                  minLength={8}
                  maxLength={20}
                />
              </div>
              <Button type="submit" className="w-full">
                Konto erstellen
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between text-sm text-muted-foreground">
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
