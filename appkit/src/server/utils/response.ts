import { Response } from 'express';

export const successResponse = (res: Response, data: any, message: string = 'Success', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const createdResponse = (res: Response, data: any, message: string = 'Created') => {
  return successResponse(res, data, message, 201);
};

export const noContentResponse = (res: Response) => {
  return res.status(204).send();
};
