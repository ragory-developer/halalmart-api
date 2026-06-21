import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler } from '../utils/helpers';
import { defaultHomePageConfig } from '../utils/homePageDefault';
import { BaseController } from './BaseController';

export class SettingController extends BaseController {
  /** Get all settings */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const settings = await prisma.setting.findMany();
    // Convert to a key-value object for easier frontend consumption
    const settingsMap = settings.reduce((acc: any, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    
    res.json({ success: true, data: settingsMap });
  });

  /** Update or create settings */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { settings } = req.body; // Expecting { key: value, ... }
    
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ success: false, message: 'Invalid settings format' });
      return;
    }

    const updates = Object.entries(settings).map(([key, value]) => 
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    );

    await prisma.$transaction(updates);
    
    res.json({ success: true, message: 'Settings updated successfully' });
  });

  /** Get Home Page Configuration */
  getHomePage = asyncHandler(async (req: Request, res: Response) => {
    const setting = await prisma.setting.findUnique({
      where: { key: 'HOME_PAGE_CONFIG' }
    });
    
    let config = defaultHomePageConfig;
    if (setting && setting.value) {
      try {
        config = JSON.parse(setting.value);
      } catch (e) {
        console.error('Failed to parse home page config', e);
      }
    }
    
    res.json({ success: true, data: config });
  });

  /** Update Home Page Configuration */
  updateHomePage = asyncHandler(async (req: Request, res: Response) => {
    const { config } = req.body;
    
    if (!config || typeof config !== 'object') {
      res.status(400).json({ success: false, message: 'Invalid configuration format' });
      return;
    }

    const valueStr = JSON.stringify(config);
    
    await prisma.setting.upsert({
      where: { key: 'HOME_PAGE_CONFIG' },
      update: { value: valueStr },
      create: { key: 'HOME_PAGE_CONFIG', value: valueStr }
    });

    res.json({ success: true, message: 'Home page configuration updated successfully' });
  });
}
