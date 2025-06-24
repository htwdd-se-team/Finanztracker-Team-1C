import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'

import * as dotenv from 'dotenv'
import { generateApi } from 'swagger-typescript-api'

const filePath = path.resolve(process.cwd(), '__generated__')
dotenv.config({ path: '.env.local' })


const apiUrl =  `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3111'}/api-json`

const main = async () => {
    if (existsSync(filePath)) {
        rmSync(filePath, { recursive: true })
    }
        
    await generateApi({
        fileName: 'api.ts',
        output: filePath,
        url: apiUrl,
        extractEnums: true,
        httpClientType: 'axios',
        typePrefix: 'Api',
        apiClassName: 'Api',

    })
}

main()
