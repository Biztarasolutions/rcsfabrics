import { Request, Response, NextFunction } from 'express';

const matchDriveUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // Match uc?id=... or open?id=... or uc?export=view&id=...
  const idMatch = url.match(/(?:drive\.google\.com\/(?:uc|open)(?:.*)[?&]id=)([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  
  // Match file/d/FILE_ID/view
  const fileDMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }
  
  return null;
};

export const driveProxyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    const host = req.get('host');
    const protocol = req.protocol;
    const backendUrl = `${protocol}://${host}`;

    const replaceUrls = (obj: any): any => {
      if (typeof obj === 'string') {
        const fileId = matchDriveUrl(obj);
        if (fileId) {
          return `${backendUrl}/api/products/image/${fileId}`;
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(replaceUrls);
      }

      if (obj !== null && typeof obj === 'object') {
        if (obj instanceof Date) return obj;
        const newObj: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = replaceUrls(obj[key]);
          }
        }
        return newObj;
      }

      return obj;
    };

    const transformedBody = replaceUrls(body);
    return originalJson.call(this, transformedBody);
  };

  next();
};
