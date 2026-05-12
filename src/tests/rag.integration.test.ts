// // tests/integration/rag.test.ts 
// import { describe, it, expect, beforeAll } from 'vitest'; 
// import { semanticSearch } from '../services/search.service.js';
 
// describe('RAG retrieval quality', () => { 
//   // Assume test documents are already ingested 
//   // with known content about specific topics 
 
//   it('finds the refund policy when asked about returns', async () => { 
//     const results = await semanticSearch({ 
//       query: 'How do I return a product?', 
//       userId: testUserId, 
//     }); 
 
//     expect(results.length).toBeGreaterThan(0); 
//     expect(results[0].score).toBeGreaterThan(0.5); 
 
//     // The top result should contain refund-related content 
//     const topContent = results[0].content.toLowerCase(); 
//     expect( 
//       topContent.includes('return') || 
//       topContent.includes('refund') || 
//       topContent.includes('reimbursement') 
//     ).toBe(true); 
//   }); 
 
//   it('returns low scores for irrelevant questions', async () => { 
//     const results = await semanticSearch({ 
//       query: 'What is quantum computing?', 
//       userId: testUserId, 
//       minScore: 0.5, 
//     }); 
 
//     // Should return nothing if documents are about company policies 
//     expect(results.length).toBe(0); 
//   }); 
 
//   it('respects document ownership', async () => { 
//     const results = await semanticSearch({ 
//       query: 'return policy', 
//       userId: otherUserId, // Different user 
//     }); 
 
//     // Should not find testUser's documents 
//     const hasTestUserDocs = results.some( 
//       r => r.documentId === testDocumentId 
//     ); 

//     // 5. RAG: Augment 
//     const context = assembleContext(searchResults); 
 
//     // 6. RAG: Generate 
//     const ragResponse = await generateRAGResponse({ 
//       question: data.content, 
//       context, 
//       conversationHistory, 
//       userId: data.userId, 
//       conversationId: data.conversationId, 
//       correlationId: data.correlationId, 
//     }); 
 
//     // 7. Save assistant message with metadata 
//     const assistantMessage = await tx.message.create({ 
//       data: { 
//         conversationId: data.conversationId, 
//         documentId: data.documentId, 
//         role: 'assistant', 
//         content: ragResponse.answer, 
//         promptTokens: ragResponse.tokensUsed.prompt, 
//         completionTokens: ragResponse.tokensUsed.completion, 
//         costUsd: ragResponse.costUsd, 
//         metadata: JSON.stringify({ 
//           model: ragResponse.model, 
//           citations: ragResponse.citations, 
//           contextChunks: context.chunks.length, 
//         }), 
//       }, 
//     }); 
 
//     // 8. Touch conversation updatedAt 
//     await tx.conversation.update({ 
//       where: { id: data.conversationId }, 
//       data: { updatedAt: new Date() }, 
//     }); 
 
//     return { 
//       userMessage, 
//       assistantMessage: { 
//         ...assistantMessage, 
//         citations: ragResponse.citations, 
//       }, 
//     }; 
//   }); 
// })