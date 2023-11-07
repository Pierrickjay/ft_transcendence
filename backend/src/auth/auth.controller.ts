import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, EditDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtGuard } from './guard';
import { GetUser } from './decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  @UseGuards(JwtGuard)
  @Post('edit')
  edit(@Body() dto: EditDto) {
    return this.authService.edit(dto);
  }
  
  @UseGuards(JwtGuard)
  @Post('editAvatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedFileExtensions = [
          '.jpg',
          '.png',
          '.jpeg',
          'xcf',
          '.pdf',
        ];
        enum FileValidationErrors {
          UNSUPPORTED_FILE_TYPE,
        }
        const extension = extname(file.originalname);
        if (allowedFileExtensions.includes(extension)) {
          cb(null, true);
        } else {
          // provide the validation error in the request
          req.fileValidationError =
            FileValidationErrors.UNSUPPORTED_FILE_TYPE;
          cb(null, false);
        }
      },
      storage: diskStorage({
        destination: '/var/avatar',

        filename: (req, file, cb) => {
          cb(null, `${Date.now()}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  editAvatar(
    @GetUser('login') user_login: string,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.authService.editAvatar(file, user_login);
  }
}
