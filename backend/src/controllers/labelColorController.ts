import { Request, Response } from 'express';
import { LabelColor } from '../models';
import { asyncHandler } from '../middleware';

// Get all label colors
export const getLabelColors = asyncHandler(async (req: Request, res: Response) => {
  const colors = await LabelColor.find().sort({ position: 1 });

  res.json({
    success: true,
    data: colors,
  });
});
