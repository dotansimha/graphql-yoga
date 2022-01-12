import { FastifyRequest } from 'fastify'
import { Injectable, Inject, CONTEXT, Scope } from 'graphql-modules'

@Injectable({
  scope: Scope.Singleton,
  global: true,
})
export class BasicProvider {
  constructor(
    @Inject(CONTEXT) private ctx: { request: Request; req: FastifyRequest },
  ) {}

  public getRequest(): string {
    console.log(
      JSON.stringify(
        this.ctx.request ? this.ctx.request.headers : this.ctx.req,
      ),
    )
    return JSON.stringify(Object.keys(this.ctx))
  }
}
