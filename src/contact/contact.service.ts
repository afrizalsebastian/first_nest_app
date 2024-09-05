import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Contact, User } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from '../common/prisma.service';
import { ValidationService } from '../common/validation.service';
import {
  ContactResponse,
  CreateContactRequest,
  SearchContactRequest,
  UpdateContactRequest,
} from '../model/contact.model';
import { Logger } from 'winston';
import { ContactValidation } from './contact.validation';
import { WebResponse } from '../model/web.model';

@Injectable()
export class ContactService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
    private validationService: ValidationService,
  ) {}

  private toContactResponse(contact: Contact) {
    return {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      id: contact.id,
    };
  }

  private async getContactExist(
    username: string,
    contactId: number,
  ): Promise<Contact> {
    const contact = await this.prismaService.contact.findFirst({
      where: {
        id: contactId,
        username: username,
      },
    });

    if (!contact) {
      throw new HttpException('Contact not found', 404);
    }

    return contact;
  }

  async create(
    user: User,
    request: CreateContactRequest,
  ): Promise<ContactResponse> {
    this.logger.debug(
      `ContactService.create ${user.username}, ${JSON.stringify(request)}`,
    );
    const createRequest = this.validationService.validate(
      ContactValidation.CREATE,
      request,
    );

    const contact = await this.prismaService.contact.create({
      data: {
        ...createRequest,
        username: user.username,
      },
    });

    return this.toContactResponse(contact);
  }

  async get(user: User, contactId: number): Promise<ContactResponse> {
    this.logger.debug(`ContactService.get ${user.username}, ${contactId}`);

    const contact = await this.getContactExist(user.username, contactId);
    return this.toContactResponse(contact);
  }

  async update(
    user: User,
    request: UpdateContactRequest,
  ): Promise<ContactResponse> {
    this.logger.debug(
      `ContactService.update ${user.username}, ${JSON.stringify(request)}`,
    );

    const updateRequest = this.validationService.validate(
      ContactValidation.UPDATE,
      request,
    );
    let contact = await this.getContactExist(user.username, updateRequest.id);

    contact = await this.prismaService.contact.update({
      where: {
        id: contact.id,
        username: contact.username,
      },
      data: updateRequest,
    });

    return this.toContactResponse(contact);
  }

  async remove(user: User, contactId: number): Promise<ContactResponse> {
    this.logger.debug(`ContactService.remove ${user.username}, ${contactId}}`);

    let contact = await this.getContactExist(user.username, contactId);

    contact = await this.prismaService.contact.delete({
      where: {
        id: contact.id,
        username: user.username,
      },
    });

    return this.toContactResponse(contact);
  }

  async search(
    user: User,
    request: SearchContactRequest,
  ): Promise<WebResponse<ContactResponse[]>> {
    this.logger.debug(
      `ContactService.search ${user.username}, ${JSON.stringify(request)}}`,
    );

    const searchReqeust = this.validationService.validate(
      ContactValidation.SEARCH,
      request,
    );

    const filters = [];

    if (searchReqeust.name) {
      filters.push({
        OR: [
          {
            first_name: {
              contains: searchReqeust.name,
            },
          },
          {
            last_name: {
              contains: searchReqeust.name,
            },
          },
        ],
      });
    }

    if (searchReqeust.email) {
      filters.push({
        email: {
          contains: searchReqeust.email,
        },
      });
    }

    if (searchReqeust.phone) {
      filters.push({
        phone: {
          contains: searchReqeust.phone,
        },
      });
    }

    const skip = (searchReqeust.page - 1) * searchReqeust.size;

    const contacts = await this.prismaService.contact.findMany({
      where: {
        username: user.username,
        AND: filters,
      },
      take: searchReqeust.size,
      skip: skip,
    });

    const total = await this.prismaService.contact.count({
      where: {
        username: user.username,
        AND: filters,
      },
    });

    return {
      data: contacts.map((it) => this.toContactResponse(it)),
      paging: {
        current_page: searchReqeust.page,
        size: searchReqeust.size,
        total_page: Math.ceil(total / searchReqeust.size),
      },
    };
  }
}
