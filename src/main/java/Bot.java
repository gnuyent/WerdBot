import commands.Roll;
import commands.Dictionary;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.requests.GatewayIntent;

import javax.security.auth.login.LoginException;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;

public class Bot extends ListenerAdapter {
    private final String prefix;
    private final Roll dice;
    private final Dictionary dictionary;

    public Bot(Properties prop) {
        this.dice = new Roll(200);
        this.prefix = prop.get("prefix").toString();
        this.dictionary = new Dictionary();
    }

    public static void main(String[] args) throws IOException, LoginException {
        Properties prop = new Properties();
        FileInputStream stream = new FileInputStream("config.properties");
        prop.load(stream);
        System.setProperty("DISCORD_TOKEN", prop.get("discordToken").toString());
        System.setProperty("MERRIAM_API_KEY", prop.get("merriamKey").toString());
        System.setProperty("WORDNIK_API_KEY", prop.get("wordnikKey").toString());

        JDABuilder.createLight(System.getProperty("DISCORD_TOKEN"), GatewayIntent.GUILD_MESSAGES)
                .addEventListeners(new Bot(prop))
                .build();
        new Bot(prop);
    }

    @Override
    public void onMessageReceived(MessageReceivedEvent event) {
        // Don't read other bots messages
        if (event.getAuthor().isBot()) return;
        String[] content = event.getMessage().getContentRaw().split(" ");
        // Ignore messages that don't start with the prefix
        if (!content[0].startsWith(this.prefix)) return;

        String command = content[0].replace(this.prefix, "");
        List<String> args = new ArrayList<>(Arrays.asList(content).subList(1, content.length));

        try {
            switch (command) {
                case "ping" -> {
                    long time = System.currentTimeMillis();
                    event.getChannel().sendMessage("Pong!") /* => RestAction<Message> */
                            .queue(response /* => Message */ -> response.editMessageFormat("Pong: %d ms", System.currentTimeMillis() - time).queue());
                }
                case "r", "roll" -> {
                    args.add("");
                    String diceConfig = String.join("", args);
                    this.dice.setEvent(event).roll(diceConfig);
                }
                case "m", "merriam", "w", "wordnik", "d", "dictionary" -> {
                    var dictionaryProvider = command.substring(0, 1);
                    this.dictionary.setEvent(event).setDictionaryProvider(dictionaryProvider).search(args);
                }
                default -> event.getChannel().sendMessage("Help text here.").queue();
            }
        } catch (IOException e) {
            System.out.println(e);
            event.getChannel().sendMessage("Unable to connect to the internet.").queue();
        }
    }
}
