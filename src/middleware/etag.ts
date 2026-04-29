// src/middleware/etag.ts
//it should be applied to read-heavy endpoints:
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const conditionalGet = () => (req: Request, res: Response, next: NextFunction) => {
  // Store the OG JSON method
  const originalJson = res.json.bind(res);

    // overide json to add etag
    res.json = function (body: any) {
      const content = JSON.stringify(body);
      const etag = `"${crypto.createHash("md5").update(content).digest("hex")}"`;

      res.setHeader("ETag", etag);

      // check of client sent IF-None-Match
      const clientEtag = req.headers["if-none-match"];
      if (clientEtag === etag) {
        res.status(304).end();
        return res;
      }
  
      return originalJson(body); 
    };

  next();
};