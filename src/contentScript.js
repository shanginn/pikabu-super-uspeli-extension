'use strict';

import ProcessedComments from "./ProcessedComments";

const processedComments = new ProcessedComments();

function isDeletedComment(comment) {
  // querySelector only closes .comment__content
  return comment
      .querySelector('.comment__content')
      .closest('.comment__content')
      .querySelector('span[style="color: #888888;"]') !== null
    //.querySelector('.comment__content>span[style="color: #888888;"]') !== null;
}

function extractCommentData(comment) {
  const id = comment.dataset.id;
  const text = comment.querySelector('.comment__content').textContent.trim();
  const images = Array
    .from(comment.querySelectorAll('.comment__content img'))
    .map(img => img.dataset.largeImage);

  return {
    id,
    text,
    images,
  };
}

function createCommentObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(async (mutation) => {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('.comment__content')) {
          await processComment(node.closest('.comment'));
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function processAllComments() {
  const comments = document.querySelectorAll('.comment');

  for (const comment of comments) {
    await processComment(comment)
  }
}

function tryToRestoreComment(id, commentElement) {
  // add class super_uspeli__comment-restoring to commentElement
  commentElement.classList.add('super_uspeli__comment-restoring');

  chrome.runtime.sendMessage({
      type: 'GET_COMMENT',
      payload: { id },
    }, (commentData) => {
    commentElement.classList.remove('super_uspeli__comment-restoring');
      if (commentData) {
        commentElement.classList.add('super_uspeli__comment-restored');
        commentElement.querySelector('.comment__content>span').textContent = commentData.text;

        if (commentData.images) {
          const commentContent = commentElement.querySelector('.comment__content');
          commentData.images.map((image) => {
            const img = document.createElement('img');

            img.classList.add('super_uspeli__comment-restored-image');
            img.src = image;

            commentContent.appendChild(img);
          });
        }
      } else {
        commentElement.classList.add('super_uspeli__comment-not_found');
      }
    }
  )
}

async function processComment(comment) {
  const data = extractCommentData(comment);

  if (isDeletedComment(comment)) {
    tryToRestoreComment(data.id, comment)

    return;
  }

  const processed = await processedComments.has(data.id);

  if (!processed) {
    sendCommentToBackground(data);
  }
}

function sendCommentToBackground(comment) {
  chrome.runtime.sendMessage({
    type: 'SAVE_COMMENT',
    payload: { comment },
  });
}

async function main() {
  await processAllComments();
  createCommentObserver();
}

main();
