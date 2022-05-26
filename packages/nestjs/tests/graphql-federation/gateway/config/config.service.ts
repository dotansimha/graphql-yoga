import { Injectable } from '@nestjs/common'
import {
  YogaGatewayDriverConfig,
  YogaGatewayDriverConfigFactory,
} from '../../../../lib'

@Injectable()
export class ConfigService implements YogaGatewayDriverConfigFactory {
  public createGqlOptions(): Partial<YogaGatewayDriverConfig> {
    return {
      gateway: {
        serviceList: [
          { name: 'users', url: 'http://localhost:3001/graphql' },
          { name: 'posts', url: 'http://localhost:3002/graphql' },
        ],
      },
    }
  }
}
