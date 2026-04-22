// For development and admin monitoring, Bull Board gives a web UI that shows all queues, their jobs, status, progress, and failures. 
import { createBullBoard } from '@bull-board/api'; 
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'; 
import { ExpressAdapter } from '@bull-board/express'; 
import { documentQueue } from '../queues/document.queue.js'; 
import { deadLetterQueue } from '../queues/deadletter.queue.js'; 
 
const serverAdapter = new ExpressAdapter(); 
serverAdapter.setBasePath('/admin/queues'); 
 
createBullBoard({ 
  queues: [ 
    new BullMQAdapter(documentQueue), 
    new BullMQAdapter(deadLetterQueue), 
  ], 
  serverAdapter, 
}); 
 
export { serverAdapter as bullBoardAdapter };