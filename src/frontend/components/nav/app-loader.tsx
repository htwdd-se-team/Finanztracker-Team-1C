import { Spinner } from '@/components/ui/spinner'
import Background from '../background'
import FinAppLogo from './finapp-logo'

export const AppLoader = () => {
  return (
    <div className="z-50 fixed inset-0 flex flex-col justify-center items-center bg-background">
      <Background />
      <div className="flex flex-col items-center">
        <FinAppLogo />
        <Spinner size="lg" className="bg-primary" />
      </div>
    </div>
  )
}
