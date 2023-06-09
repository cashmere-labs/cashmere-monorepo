import { faker } from '@faker-js/faker';
import { Address, Hex } from 'viem';

export const fakerInt = (min: number, max: number) => {
    let value: number;
    while (fakerInt.cache.has((value = faker.number.int({ min, max }))));
    fakerInt.cache.add(value);
    return value;
};
fakerInt.cache = new Set();

export const fakerEthereumAddress = () => {
    let value: Address;
    while (
        fakerEthereumAddress.cache.has(
            (value = faker.finance.ethereumAddress() as Address)
        )
    );
    fakerEthereumAddress.cache.add(value);
    return value;
};
fakerEthereumAddress.cache = new Set();

export const fakerHexadecimalString = (length: number) => {
    let value: Hex;
    while (
        fakerHexadecimalString.cache.has(
            (value = faker.string.hexadecimal({ length }) as Hex)
        )
    );
    fakerHexadecimalString.cache.add(value);
    return value;
};
fakerHexadecimalString.cache = new Set();

export const fakerNumericString = (length: number) => {
    let value: Hex;
    while (
        fakerNumericString.cache.has(
            (value = faker.string.numeric({ length }) as Hex)
        )
    );
    fakerNumericString.cache.add(value);
    return value;
};
fakerNumericString.cache = new Set();

export const fakerUuid = () => {
    let value: string;
    while (fakerUuid.cache.has((value = faker.string.uuid())));
    fakerUuid.cache.add(value);
    return value;
};
fakerUuid.cache = new Set();

export const fakerResetCache = () => {
    fakerInt.cache = new Set();
    fakerEthereumAddress.cache = new Set();
    fakerHexadecimalString.cache = new Set();
    fakerUuid.cache = new Set();
};
