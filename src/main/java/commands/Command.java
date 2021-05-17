package commands;

import net.dv8tion.jda.api.events.message.MessageReceivedEvent;

abstract class Command<T> {
    MessageReceivedEvent event;

    public T setEvent(MessageReceivedEvent event) {
        this.event = event;
        return (T)this;
    }

    String getAuthor() {
        return this.event.getAuthor().getAsMention();
    }

    void sendMessage(String message) {
        this.event.getChannel().sendMessage(message).queue();
    }

    void sendError(String error) {
        this.event.getChannel().sendMessage("Error: " + error).queue();
    }
}
