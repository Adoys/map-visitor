import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLanguageDto } from './dto/create-language.dto';
import { CompanyLanguage } from 'src/company-languages/entities/company-language.entity';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { CompanySettings } from 'src/company-settings/entities/company-settings.entity';

@Injectable()
export class CompanyLanguagesService {
  constructor(
    @InjectRepository(CompanyLanguage)
    private readonly repo: Repository<CompanyLanguage>,
    @InjectRepository(CompanySettings)
    private readonly settingsRepo: Repository<CompanySettings>,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async findAll() {
    return this.repo.find();
  }

  async create(dto: CreateLanguageDto) {
    if (dto.isDefault) {
      const defaultCount = await this.repo.count({
        where: { isDefault: true },
      });
      if (defaultCount >= 1) {
        throw new BadRequestException(
          'No se puede tener más de 1 idiomas por defecto.',
        );
      }
    }

    let settings = await this.settingsRepo.findOneBy({});

    if (!settings) {
      settings = await this.settingsRepo.save(this.settingsRepo.create({}));
    }
    const lang = this.repo.create({ ...dto });
    return this.repo.save(lang);
  }

  async update(id: number, dto: UpdateLanguageDto) {
    if (dto.isDefault) {
      const current = await this.repo.findOne({ where: { id } });
      const defaultCount = await this.repo.count({
        where: { isDefault: true },
      });

      // Si actualmente no es default y hay 1 por defecto, no permitimos
      if (!current?.isDefault && defaultCount >= 1) {
        throw new BadRequestException(
          'No se puede tener más de 1 idiomas por defecto.',
        );
      }
    }

    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number) {
    return this.repo.delete(id);
  }
}
