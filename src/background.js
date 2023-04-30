'use strict';

import ProcessedComments from './ProcessedComments.js';
import DatabaseConnection from './DatabaseConnection';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_COMMENT') {
    const comment = request.payload.comment;
    const processedComments = new ProcessedComments();

    console.log('Processing comment:', comment);

    processedComments.has(comment.id).then(async (processed) => {
      console.log('Processed:', processed);
      if (!processed) {
        await processedComments.add(comment.id);
        await saveCommentToDB(comment);
      }
    });

    return true;
  }

  if (request.type === 'GET_COMMENT') {
    getCommentFromDb(request.payload.id)
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse(null);
      });

    return true;
  }
});

async function saveCommentToDB(commentData) {
  try {
    await DatabaseConnection.init();
  } catch (error) {
    console.error('Error initializing DB:', error);
  }

  try {
    await DatabaseConnection.instance.create('comments', commentData);
    console.log('Comment saved to DB:', commentData.id);
  } catch (error) {
    console.error('Error saving comment to DB:', error);
  }
}

async function getCommentFromDb(id) {
  try {
    await DatabaseConnection.init();
  } catch (error) {
    console.error('Error initializing DB:', error);
  }

  try {
    console.log('Comment retrieved from DB:', id);

    return await DatabaseConnection.instance.select(`comments:⟨${id}⟩`);
  } catch (error) {
    console.log('Error getting comment from DB:', error);
  }

  return null;
}
