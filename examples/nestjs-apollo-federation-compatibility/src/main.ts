import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger()
  const app = await NestFactory.create(AppModule, { logger })
  await app.listen(4001)
  logger.log('Nest.js server listening on http://localhost:4001')
}
bootstrap()
