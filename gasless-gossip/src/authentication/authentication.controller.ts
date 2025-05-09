import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { LoginDTO, RefreshTokenDTO } from './dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserDocument } from 'src/modules/user/schemas/user.schema';

@ApiTags('Authentication') // Adds a category in Swagger UI
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('signup')
  async signup(@Body() body: CreateUserDto): Promise<UserDocument | null> {
    const response = await this.authService.create(body);
    return response;
  }

  @Post('login')
  async login(@Body() body: LoginDTO): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return await this.authService.generateTokens(user);
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDTO): Promise<any> {
    return await this.authService.refreshAccessToken(body.refreshToken);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token
    if (!token) return { message: 'No token provided' };

    await this.authService.blacklistToken(token, 3600); // Blacklist for 1 hour
    return { message: 'Logged out successfully' };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
