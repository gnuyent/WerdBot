package commands;

import java.util.ArrayList;
import java.util.List;

class Dice {
    int diceCount;
    int diceSides;
    int rollBonus;

    enum Type {
        NUMBER, DICESEP, PLUS
    }

    static class Token {
        Type t;
        String c;

        Token(Type t, String c) {
            this.t = t;
            this.c = c;
        }

        Type getType() {
            return this.t;
        }

        String getString() {
            return this.c;
        }
    }

    Dice(String input) {
        this.diceCount = 1;
        this.diceSides = 20;
        this.rollBonus = 0;

        if (!input.isBlank()) {
            List<Token> tokens = lex(input);
            boolean bonus = false;

            int num = 0;

            for (Token t : tokens) {
                if (t.getType() == Type.NUMBER) {
                    num = Integer.parseInt(t.getString());
                } else if (t.getType() == Type.DICESEP && num != 0) {
                    this.diceCount = num;
                    num = 0;
                } else if (t.getType() == Type.PLUS && num != 0) {
                    this.diceSides = num;
                    num = 0;
                    bonus = true;
                }
            }

            if (!bonus) {
                this.diceSides = num;
            } else {
                this.rollBonus = num;
            }
        }
    }


    private List<Token> lex(String token) {
        List<Token> result = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < token.length(); i++) {
            char focus = token.charAt(i);
            if (Character.isDigit(focus)) {
                sb.append(focus);
            } else if (focus == 'd' || focus == '+') {
                if (sb.length() != 0) {
                    result.add(new Token(Type.NUMBER, sb.toString()));
                    sb.setLength(0);
                }
                if (focus == 'd') {
                    result.add(new Token(Type.DICESEP, "d"));
                } else {
                    result.add(new Token(Type.PLUS, "+"));
                }
            }
        }

        if (sb.length() != 0) {
            result.add(new Token(Type.NUMBER, sb.toString()));
        }

        return result;
    }

    @Override
    public String toString() {
        return "Dice Count: " + this.diceCount + "\nDice Sides: " + this.diceSides + "\nRoll Bonus: " + this.rollBonus;
    }
}

public class Roll extends Command<Roll> {
    int maxDice; // Maximum number of dice to roll

    public Roll(int dice) {
        this.maxDice = dice;
    }

    public void roll(String diceConfig) {
        StringBuilder outStr = new StringBuilder();
        Dice d;

        d = new Dice(diceConfig);

        if (d.diceCount > this.maxDice) {
            sendError("too many dice! (max: " + this.maxDice + ")");
            return;
        }

        outStr.append(getAuthor()).append(String.format(" :game_die:\n**Result**: %sd%s (", d.diceCount, d.diceSides));

        int total = d.rollBonus;

        for (int i = 0; i < d.diceCount; i++) {
            // 1 to max, inclusive
            int random = (int) (Math.random() * (d.diceSides) + 1);
            total += random;

            // bold if max or 1
            if (random == d.diceSides || random == 1) {
                outStr.append(String.format("**%s**", random));
            } else {
                outStr.append(random);
            }

            // add commas
            if (i != d.diceCount - 1) {
                outStr.append(", ");
            }
        }
        outStr.append(")");
        if (d.rollBonus != 0) {
            outStr.append(String.format(" + %s", d.rollBonus));
        }
        outStr.append(String.format("\n**Total**: %s", total));
        sendMessage(outStr.toString());
    }
}
