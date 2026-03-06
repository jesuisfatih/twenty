import {
  Body,
  Controller,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { AuthService } from 'src/engine/core-modules/auth/services/auth.service';
import { LoginTokenService } from 'src/engine/core-modules/auth/token/services/login-token.service';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';

interface IframeSessionBody {
  email: string;
  password: string;
}

@Controller('auth')
@UseFilters(AuthRestApiExceptionFilter)
export class IframeAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginTokenService: LoginTokenService,
  ) {}

  /**
   * POST /auth/iframe-session
   *
   * Generates auth tokens for iframe embedding.
   * Authenticated via API key (Authorization: Bearer <API_KEY_TOKEN>).
   *
   * Request body: { email: string, password: string }
   * Response: { tokens: { accessToken, refreshToken }, iframeUrl: string }
   */
  @Post('iframe-session')
  @UseGuards(JwtAuthGuard)
  async createIframeSession(
    @Body() body: IframeSessionBody,
    @Req() req: any,
  ) {
    const workspace = req.workspace;

    // Validate user credentials
    const user = await this.authService.validateLoginWithPassword(
      { email: body.email, password: body.password },
      workspace,
    );

    // Generate auth tokens
    const authTokens = await this.authService.verify(
      user.email,
      workspace.id,
      AuthProviderEnum.Password,
    );

    // Build iframe URL with tokens encoded in hash fragment
    // Hash fragments are NOT sent to the server, making this secure
    const tokenPayload = Buffer.from(
      JSON.stringify(authTokens.tokens),
    ).toString('base64');

    const baseUrl =
      process.env.FRONTEND_BASE_URL || 'https://sales.techifyboost.com';
    const iframeUrl = `${baseUrl}/iframe-auth#t=${tokenPayload}`;

    return {
      tokens: authTokens.tokens,
      iframeUrl,
    };
  }
}
