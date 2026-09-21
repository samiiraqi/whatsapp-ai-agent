export class ConversationEngine {
  constructor({ brain, store, sender }) {
    this.brain = brain;
    this.store = store;
    this.sender = sender;
  }

  async handleMessage(message) {
    const { from, text } = message;

    this.store.addMessage(from, "in", text);

    if (this.store.isHandoff(from)) {
      return;
    }

    const { text: reply, handoff } = this.brain.reply({ text });

    this.store.addMessage(from, "out", reply);
    if (handoff) {
      this.store.setHandoff(from, true);
    }

    await this.sender.send(from, reply);
  }
}
