package commands;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import org.apache.commons.io.IOUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class Dictionary extends Command<Dictionary> {
    // Merriam-Webster API Deserializer
    // Referenced from https://www.dictionaryapi.com/products/json#sec-2
    private static class MerriamDeserializer {
        static class EntryMetadata {
            String id;
        }

        static class HeadwordInformation {
            Map<String, Object>[] prs;
        }

        commands.Dictionary.MerriamDeserializer.EntryMetadata meta;
        commands.Dictionary.MerriamDeserializer.HeadwordInformation hwi;
        String fl;
        String[] shortdef;
    }

    // Wordnik API Deserializer
    private static class WordnikDeserializer {
        String word;
        String partOfSpeech;
        String text;
        String wordnikUrl;
        // Pronunciation
        String raw;
    }

    private static class Word {
        String word;
        String partOfSpeech;
        List<String> definitions;
        String pronunciation;

        Word(MerriamDeserializer[] d) {
            var wordInfo = d[0];
            this.word = wordInfo.meta.id.split(":")[0];
            this.partOfSpeech = wordInfo.fl;
            this.pronunciation = (String) wordInfo.hwi.prs[0].get("mw");
            this.definitions = Arrays.stream(wordInfo.shortdef).toList();
        }

        Word(WordnikDeserializer[] d) {
            var wordInfo = d[1];
            this.word = wordInfo.word;
            this.partOfSpeech = wordInfo.partOfSpeech;
//            this.pronunciation = wordInfo.raw;
            this.pronunciation = ""; // FIXME: band-aid
            this.definitions = new ArrayList<>(Collections.singletonList(wordInfo.text));
        }

        @Override
        public String toString() {
            return String.format("%s %s %s %s", this.word, this.partOfSpeech, this.pronunciation, this.definitions);
        }
    }

    private enum DictionaryProvider {
        MERRIAM("Merriam-Webster"), WORDNIK("Wordnik"), DICTIONARYCOM("Dictionary.com");
        private final String name;

        DictionaryProvider(String name) {
            this.name = name;
        }

        @Override
        public String toString() {
            return name;
        }
    }

    private DictionaryProvider dictionaryProvider;

    public Dictionary setDictionaryProvider(String dictionaryProvider) {
        switch (dictionaryProvider) {
            case "m" -> this.dictionaryProvider = DictionaryProvider.MERRIAM;
            case "w" -> this.dictionaryProvider = DictionaryProvider.WORDNIK;
            case "d" -> this.dictionaryProvider = DictionaryProvider.DICTIONARYCOM;
            default -> throw new IllegalArgumentException("Error: unexpected value: " + dictionaryProvider);
        }
        return this;
    }

    public void search(List<String> word) throws IOException {
        Word w;
        StringBuilder sb = new StringBuilder();

        sb.append(getAuthor());

        String header;
        if (word.size() == 0) {
            Object[] arr = parseWordOfTheDay();
            w = (Word) arr[0];
            String date = (String) arr[1];
            URL url = switch (dictionaryProvider) {
                case MERRIAM -> new URL("https://www.merriam-webster.com/word-of-the-day");
                case WORDNIK -> new URL("https://www.wordnik.com/word-of-the-day");
                default -> throw new UnsupportedOperationException("Not supported yet.");
            };
            header = String.format("\n**Word of the Day (%s) : %s**\n<%s>\n", dictionaryProvider, date, url);
        } else {
            w = parseWord(String.join(" ", word));
            URL url = switch (dictionaryProvider) {
                case MERRIAM -> new URL("https://www.merriam-webster.com/dictionary/" + w.word);
                case WORDNIK -> new URL("https://www.wordnik.com/words/" + w.word);
                default -> throw new UnsupportedOperationException("Not supported yet.");
            };
            header = String.format("\n**%s**\n<%s>\n", dictionaryProvider, url);
        }
        sb.append(header);

        // Searched Word
        sb.append("**").append(w.word).append("** ");

        // Part of Speech
        sb.append("(").append(w.partOfSpeech).append(")");

        // Pronunciation Guide
        sb.append(" | ").append(w.pronunciation);

        // Definitions
        if (w.definitions.size() == 1) {
            sb.append("\n").append(w.definitions.get(0)).append("\n\n");
        } else {
            sb.append("\n");
            for (int i = 0; i < w.definitions.size(); i++) {
                sb.append(i + 1).append(". ").append(w.definitions.get(i)).append("\n");
            }
            sb.append("\n");
        }

        sendMessage(sb.toString());
    }

    private Word parseWord(String word) throws IOException {
        Word w;
        try {
            switch (this.dictionaryProvider) {
                case MERRIAM -> {
                    var url = new URL("https://www.dictionaryapi.com/api/v3/references/collegiate/json/" + word + "?key=" + System.getProperty("MERRIAM_API_KEY"));
                    var text = IOUtils.toString(url.openStream(), StandardCharsets.UTF_8);
                    return new Word(new Gson().fromJson(text, MerriamDeserializer[].class));
                }
                case WORDNIK -> {
                    var url = new URL("https://api.wordnik.com/v4/word.json/" + word + "/definitions?limit=5&includeRelated=false&useCanonical=false&includeTags=false&api_key=" + System.getProperty("WORDNIK_API_KEY"));
                    var text = IOUtils.toString(url.openStream(), StandardCharsets.UTF_8);
                    return new Word(new Gson().fromJson(text, WordnikDeserializer[].class));
                }
                default -> throw new UnsupportedOperationException("Not supported yet.");
            }
        } catch (JsonSyntaxException e) {
            // FIXME: autocorrect to the right word
            sendError("unable to find the word `" + word + "`");
            throw new IllegalArgumentException("Unable to find word: " + word);
        }
    }

    private Object[] parseWordOfTheDay() throws IOException {
        String date;
        String word;
        switch (this.dictionaryProvider) {
            case MERRIAM -> {
                Document doc = Jsoup.connect("https://www.merriam-webster.com/word-of-the-day").get();
                word = doc.select(".word-and-pronunciation > h1:nth-child(1)").text();
                date = doc.select(".w-a-title").text().split(":")[1].trim();
            }
            default -> throw new UnsupportedOperationException("Not supported yet.");
        }

        return new Object[]{parseWord(word), date};
    }
}