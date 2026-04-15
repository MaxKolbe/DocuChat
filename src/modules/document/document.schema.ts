import { z } from 'zod'; 
 
export const createDocumentSchema = z.object({ 
  body: z.object({ 
    title: z.string().min(1, 'Title is required').max(500), 
    content: z.string().min(1, 'Content is required'), 
  }), 
}); 
 
export const listDocumentsSchema = z.object({ 
  query: z.object({ 
    page: z.coerce.number().int().min(1).default(1), 
    limit: z.coerce.number().int().min(1).max(100).default(20), // may not need default
    status: z.enum(['pending', 'processing', 'ready', 'failed']).optional(), 
  }), 
}); 
 
export const documentParamsSchema = z.object({ 
  params: z.object({ 
    id: z.string().uuid('Invalid document ID'), 
  }), 
}); 

export type Createdocuments = z.infer<typeof createDocumentSchema>
export type Listdocuments = z.infer<typeof listDocumentsSchema>
export type Documentparams = z.infer<typeof documentParamsSchema>