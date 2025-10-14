import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ async: false })
export class IsValidJsonConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === null || value === undefined) {
      return true; // Allow null/undefined for optional fields
    }

    if (typeof value === "string") {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }

    // If it's already an object, it's valid
    return typeof value === "object";
  }

  defaultMessage(args: ValidationArguments) {
    return "Payload must be valid JSON";
  }
}

export function IsValidJson(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidJsonConstraint,
    });
  };
}

@ValidatorConstraint({ async: false })
export class IsValidUrlConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== "string") {
      return false;
    }

    try {
      const url = new URL(value);
      // Only allow http and https protocols
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return "URL must be a valid HTTP or HTTPS URL";
  }
}

export function IsValidUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidUrlConstraint,
    });
  };
}

@ValidatorConstraint({ async: false })
export class IsValidHeadersConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === null || value === undefined) {
      return true; // Allow null/undefined for optional fields
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    // Check that all keys and values are strings
    for (const [key, val] of Object.entries(value)) {
      if (typeof key !== "string" || typeof val !== "string") {
        return false;
      }

      // Check for valid header name format (basic validation)
      if (!/^[a-zA-Z0-9\-_]+$/.test(key)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return "Headers must be an object with string keys and values, and valid header names";
  }
}

export function IsValidHeaders(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidHeadersConstraint,
    });
  };
}
