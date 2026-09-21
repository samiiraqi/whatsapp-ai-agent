// MessageSender interface: send(to, text) -> Promise<{ id }>

export class FakeMessageSender {
  constructor() {
    this.sent = [];
  }

  async send(to, text) {
    const id = `fake-${this.sent.length + 1}`;
    this.sent.push({ to, text, id });
    return { id };
  }
}
