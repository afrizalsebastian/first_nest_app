import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Address, User } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from '../common/prisma.service';
import { ValidationService } from '../common/validation.service';
import {
  AddressResponse,
  CreateAddressRequest,
  GetAddressRequest,
  UpdateAddressRequest,
} from '../model/address.model';
import { Logger } from 'winston';
import { AddressValidation } from './address.validation';
import { ContactService } from '../contact/contact.service';

@Injectable()
export class AddressService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
    private validationService: ValidationService,
    private contactService: ContactService,
  ) {}

  private toAddressResponse(address: Address): AddressResponse {
    return {
      id: address.id,
      street: address.street,
      city: address.city,
      province: address.province,
      country: address.country,
      postal_code: address.postal_code,
    };
  }

  private async getAddressExist(
    contactId: number,
    addressId: number,
  ): Promise<Address> {
    const address = await this.prismaService.address.findFirst({
      where: {
        id: addressId,
        contact_id: contactId,
      },
    });

    if (!address) {
      throw new HttpException('Address is not found', 404);
    }

    return address;
  }

  async create(
    user: User,
    request: CreateAddressRequest,
  ): Promise<AddressResponse> {
    this.logger.debug(
      `AddressService.create ${user.username}, ${JSON.stringify(request)}`,
    );

    const createRequest = this.validationService.validate(
      AddressValidation.CREATE,
      request,
    );

    await this.contactService.getContactExist(
      user.username,
      createRequest.contact_id,
    );

    const address = await this.prismaService.address.create({
      data: createRequest,
    });

    return this.toAddressResponse(address);
  }

  async get(user: User, request: GetAddressRequest): Promise<AddressResponse> {
    this.logger.debug(
      `AddressService.get ${user.username}, ${JSON.stringify(request)}`,
    );

    const getRequest = this.validationService.validate(
      AddressValidation.GET,
      request,
    );

    await this.contactService.getContactExist(
      user.username,
      getRequest.contact_id,
    );

    const address = await this.getAddressExist(
      getRequest.contact_id,
      getRequest.address_id,
    );

    return this.toAddressResponse(address);
  }

  async update(
    user: User,
    request: UpdateAddressRequest,
  ): Promise<AddressResponse> {
    this.logger.debug(
      `AddressService.update ${user.username}, ${JSON.stringify(request)}`,
    );

    const updateRequest = this.validationService.validate(
      AddressValidation.UPDATE,
      request,
    );

    await this.contactService.getContactExist(
      user.username,
      updateRequest.contact_id,
    );

    let address = await this.getAddressExist(
      updateRequest.contact_id,
      updateRequest.id,
    );

    address = await this.prismaService.address.update({
      where: {
        id: address.id,
        contact_id: address.contact_id,
      },
      data: updateRequest,
    });

    return this.toAddressResponse(address);
  }
}
