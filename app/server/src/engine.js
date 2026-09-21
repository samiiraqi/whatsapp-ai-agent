import { hashPhone } from "./store.js";
import { detectLanguage } from "./language.js";
import { wantsHuman, wantsToOrder, humanHandoffMessage } from "./intents.js";
import { startOrderFlow, continueOrderFlow } from "./orderFlow.js";

export class ConversationEngine {
  constructor({ brain, store, sender, crm }) {
    this.brain = brain;
    this.store = store;
    this.sender = sender;
    this.crm = crm;
  }

  async handleMessage(message) {
    const { from, text } = message;

    this.store.addMessage(from, "in", text);

    if (this.store.isHandoff(from)) {
      return;
    }

    const flowState = this.store.getFlowState(from);

    if (flowState) {
      if (wantsHuman(text)) {
        this.store.setFlowState(from, null);
        return this.sendReply(from, humanHandoffMessage(text), true);
      }

      const result = continueOrderFlow(flowState, text);
      this.store.setFlowState(from, result.state);

      if (result.lead) {
        this.crm.saveLead({
          ...result.lead,
          createdAt: new Date().toISOString(),
          conversationHash: hashPhone(from),
        });
      }

      return this.sendReply(from, result.reply, false);
    }

    if (wantsToOrder(text)) {
      const { state, reply } = startOrderFlow(detectLanguage(text));
      this.store.setFlowState(from, state);
      return this.sendReply(from, reply, false);
    }

    const { text: reply, handoff } = this.brain.reply({ text });
    return this.sendReply(from, reply, handoff);
  }

  async sendReply(from, text, handoff) {
    this.store.addMessage(from, "out", text);
    if (handoff) {
      this.store.setHandoff(from, true);
    }
    await this.sender.send(from, text);
  }
}
