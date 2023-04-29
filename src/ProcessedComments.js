export default class ProcessedComments {
  constructor() {
    this.keyPrefix = 'processedComment_';
  }

  // Add a comment ID to the processed comments and store it in chrome.storage
  async add(id) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.keyPrefix + id]: true }, () => {
        resolve();
      });
    });
  }

  // Check if a comment ID is in the processed comments
  async has(id) {
    return new Promise((resolve) => {
      chrome.storage.local.get(this.keyPrefix + id, (result) => {
        resolve(result[this.keyPrefix + id] === true);
      });
    });
  }
}
