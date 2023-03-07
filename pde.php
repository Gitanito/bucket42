<?php

if (class_exists('ParsedownExtra')) {
    class DynamicParent extends \ParsedownExtra
    {
        public function __construct()
        {
            parent::__construct();
        }
    }
} else {
    class DynamicParent extends \Parsedown
    {
        public function __construct()
        {
        }
    }
}

class ParsedownExtended extends DynamicParent
{
    public const VERSION = '1.1';
    public const VERSION_PARSEDOWN_REQUIRED = '1.8';
    public const ID_ATTRIBUTE_DEFAULT = 'toc';
    protected $tagToc = '[toc]';

    protected $contentsListArray = [];
    protected $contentsListString = '';
    protected $firstHeadLevel = 0;

    protected $isBlacklistInitialized = false;
    protected $anchorDuplicates = [];

    protected $specialCharacters = [
        '\\', '`', '*', '_', '{', '}', '[', ']', '(', ')', '>', '#', '+', '-', '.', '!', '|', '?', '"', "'", '<',
    ];

    /**
     * Version requirement check.
     */
    public function __construct(array $params = null)
    {
        if (version_compare(\Parsedown::version, self::VERSION_PARSEDOWN_REQUIRED) < 0) {
            $msgError = 'Version Error.'.PHP_EOL;
            $msgError .= '  ParsedownExtended requires a later version of Parsedown.'.PHP_EOL;
            $msgError .= '  - Current version : '.\Parsedown::version.PHP_EOL;
            $msgError .= '  - Required version: '.self::VERSION_PARSEDOWN_REQUIRED.' and later'.PHP_EOL;

            throw new Exception($msgError);
        }

        parent::__construct();

        if (!empty($params)) {
            $this->options = $params;
        }

        /*
         * Inline
         * ------------------------------------------------------------------------.
         */

        $this->options['toc'] = $this->options['toc'] ?? false;

        // Marks
        $state = $this->options['mark'] ?? true;
        if ($state !== false) {
            $this->InlineTypes['='][] = 'mark';
            $this->inlineMarkerList .= '=';
        }

        // Keystrokes
        $state = $this->options['keystrokes'] ?? true;
        if ($state !== false) {
            $this->InlineTypes['['][] = 'Keystrokes';
            $this->inlineMarkerList .= '[';
        }

        // Inline Math
        $state = $this->options['math'] ?? false;
        if ($state !== false) {
            $this->InlineTypes['\\'][] = 'Math';
            $this->inlineMarkerList .= '\\';
            $this->InlineTypes['$'][] = 'Math';
            $this->inlineMarkerList .= '$';
        }

        // Superscript
        $state = $this->options['sup'] ?? false;
        if ($state !== false) {
            $this->InlineTypes['^'][] = 'Superscript';
            $this->inlineMarkerList .= '^';
        }

        // Subscript
        $state = $this->options['sub'] ?? false;
        if ($state !== false) {
            $this->InlineTypes['~'][] = 'Subscript';
        }

        // Emojis
        $state = $this->options['emojis'] ?? true;
        if ($state !== false) {
            $this->InlineTypes[':'][] = 'Emojis';
            $this->inlineMarkerList .= ':';
        }

        // Typographer
        $state = $this->options['typographer'] ?? false;
        if ($state !== false) {
            $this->InlineTypes['('][] = 'Typographer';
            $this->inlineMarkerList .= '(';
            $this->InlineTypes['.'][] = 'Typographer';
            $this->inlineMarkerList .= '.';
            $this->InlineTypes['+'][] = 'Typographer';
            $this->inlineMarkerList .= '+';
            $this->InlineTypes['!'][] = 'Typographer';
            $this->inlineMarkerList .= '!';
            $this->InlineTypes['?'][] = 'Typographer';
            $this->inlineMarkerList .= '?';
        }

        // Smartypants
        $state = $this->options['smarty'] ?? false;
        if ($state !== false) {
            $this->InlineTypes['<'][] = 'Smartypants';
            $this->inlineMarkerList .= '<';
            $this->InlineTypes['>'][] = 'Smartypants';
            $this->inlineMarkerList .= '>';
            $this->InlineTypes['-'][] = 'Smartypants';
            $this->inlineMarkerList .= '-';
            $this->InlineTypes['.'][] = 'Smartypants';
            $this->inlineMarkerList .= '.';
            $this->InlineTypes["'"][] = 'Smartypants';
            $this->inlineMarkerList .= "'";
            $this->InlineTypes['"'][] = 'Smartypants';
            $this->inlineMarkerList .= '"';
            $this->InlineTypes['`'][] = 'Smartypants';
            $this->inlineMarkerList .= '`';
        }

        /*
         * Blocks
         * ------------------------------------------------------------------------
         */

        // Block Math
        $state = $this->options['math'] ?? false;
        if ($state !== false) {
            $this->BlockTypes['\\'][] = 'Math';
            $this->BlockTypes['$'][] = 'Math';
        }

        // Task
        $state = $this->options['lists']['tasks'] ?? true;
        if ($state !== false) {
            $this->BlockTypes['['][] = 'Checkbox';
        }
    }

    /**
     * Parses the given markdown string to an HTML string but it leaves the ToC
     * tag as is. It's an alias of the parent method "\DynamicParent::text()".
     */
    public function body($text): string
    {
        $text = $this->encodeTagToHash($text);  // Escapes ToC tag temporary
        $html = DynamicParent::text($text);     // Parses the markdown text

        return $this->decodeTagFromHash($html); // Unescape the ToC tag
    }

    /**
     * Parses markdown string to HTML and also the "[toc]" tag as well.
     * It overrides the parent method: \Parsedown::text().
     */
    public function text($text)
    {
        // Parses the markdown text except the ToC tag. This also searches
        // the list of contents and available to get from "contentsList()"
        // method.
        $html = $this->body($text);

        if (isset($this->options['toc']) && false == $this->options['toc']) {
            return $html;
        }

        $tagOrigin = $this->getTagToC();

        if (strpos($text, $tagOrigin) === false) {
            return $html;
        }

        $tocData = $this->contentsList();
        $tocId = $this->getIdAttributeToC();
        $needle = '<p>'.$tagOrigin.'</p>';
        $replace = "<div id=\"{$tocId}\">{$tocData}</div>";

        return str_replace($needle, $replace, $html);
    }

    /**
     * Returns the parsed ToC.
     *
     * @param string $typeReturn Type of the return format. "html" or "json".
     *
     * @return string HTML/JSON string of ToC
     */
    public function contentsList($typeReturn = 'html')
    {
        if ('html' === strtolower($typeReturn)) {
            $result = '';
            if (!empty($this->contentsListString)) {
                // Parses the ToC list in markdown to HTML
                $result = $this->body($this->contentsListString);
            }

            return $result;
        }

        if ('json' === strtolower($typeReturn)) {
            return json_encode($this->contentsListArray);
        }

        // Forces to return ToC as "html"
        error_log(
            'Unknown return type given while parsing ToC.'
            .' At: '.__FUNCTION__.'() '
            .' in Line:'.__LINE__.' (Using default type)'
        );

        return $this->contentsList('html');
    }

    protected function inlineText($text)
    {
        $Inline = [
            'extent' => strlen($text),
            'element' => [],
        ];

        $Inline['element']['elements'] = self::pregReplaceElements(
            $this->breaksEnabled ? '/[ ]*+\n/' : '/(?:[ ]*+\\\\|[ ]{2,}+)\n/',
            [
                ['name' => 'br'],
                ['text' => "\n"],
            ],
            $text
        );

        return DynamicParent::inlineText($text);
    }

    /**
     * ------------------------------------------------------------------------
     * Inline
     * ------------------------------------------------------------------------.
     */

    // inlineCode
    protected function inlineCode($excerpt)
    {
        $codeSnippets = $this->options['code']['inline'] ?? true;
        $codeMain = $this->options['code'] ?? true;
        if ($codeSnippets === true and $codeMain === true) {
            return DynamicParent::inlineCode($excerpt);
        }
    }

    protected function inlineEmailTag($excerpt)
    {
        $mainState = $this->options['links'] ?? true;
        $state = $this->options['links']['email_links'] ?? true;
        if ($mainState and $state) {
            return DynamicParent::inlineEmailTag($excerpt);
        }
    }

    protected function inlineEmphasis($excerpt)
    {
        $state = $this->options['emphasis'] ?? true;
        if ($state) {
            return DynamicParent::inlineEmphasis($excerpt);
        }
    }

    protected function inlineImage($excerpt)
    {
        $state = $this->options['images'] ?? true;
        if ($state) {
            return DynamicParent::inlineImage($excerpt);
        }
    }

    protected function inlineLink($excerpt)
    {
        $state = $this->options['links'] ?? true;
        if ($state) {
            return DynamicParent::inlineLink($excerpt);
        }
    }

    protected function inlineMarkup($excerpt)
    {
        $state = $this->options['markup'] ?? true;
        if ($state) {
            return DynamicParent::inlineMarkup($excerpt);
        }
    }

    protected function inlineStrikethrough($excerpt)
    {
        $state = $this->options['strikethroughs'] ?? true;
        if ($state) {
            return DynamicParent::inlineStrikethrough($excerpt);
        }
    }

    protected function inlineUrl($excerpt)
    {
        $state = $this->options['links'] ?? true;
        if ($state) {
            return DynamicParent::inlineUrl($excerpt);
        }
    }

    protected function inlineUrlTag($excerpt)
    {
        $state = $this->options['links'] ?? true;
        if ($state) {
            return DynamicParent::inlineUrlTag($excerpt);
        }
    }

    protected function inlineEmojis($excerpt)
    {
        $emojiMap = [
            ':smile:' => '??', ':laughing:' => '??', ':blush:' => '??', ':smiley:' => '??',
            ':relaxed:' => '??', ':smirk:' => '??', ':heart_eyes:' => '??', ':kissing_heart:' => '??',
            ':kissing_closed_eyes:' => '??', ':flushed:' => '??', ':relieved:' => '??', ':satisfied:' => '??',
            ':grin:' => '??', ':wink:' => '??', ':stuck_out_tongue_winking_eye:' => '??', ':stuck_out_tongue_closed_eyes:' => '??',
            ':grinning:' => '??', ':kissing:' => '??', ':kissing_smiling_eyes:' => '??', ':stuck_out_tongue:' => '??',
            ':sleeping:' => '??', ':worried:' => '??', ':frowning:' => '??', ':anguished:' => '??',
            ':open_mouth:' => '??', ':grimacing:' => '??', ':confused:' => '??', ':hushed:' => '??',
            ':expressionless:' => '??', ':unamused:' => '??', ':sweat_smile:' => '??', ':sweat:' => '??',
            ':disappointed_relieved:' => '??', ':weary:' => '??', ':pensive:' => '??', ':disappointed:' => '??',
            ':confounded:' => '??', ':fearful:' => '??', ':cold_sweat:' => '??', ':persevere:' => '??',
            ':cry:' => '??', ':sob:' => '??', ':joy:' => '??', ':astonished:' => '??',
            ':scream:' => '??', ':tired_face:' => '??', ':angry:' => '??', ':rage:' => '??',
            ':triumph:' => '??', ':sleepy:' => '??', ':yum:' => '??', ':mask:' => '??',
            ':sunglasses:' => '??', ':dizzy_face:' => '??', ':imp:' => '??', ':smiling_imp:' => '??',
            ':neutral_face:' => '??', ':no_mouth:' => '??', ':innocent:' => '??', ':alien:' => '??',
            ':yellow_heart:' => '??', ':blue_heart:' => '??', ':purple_heart:' => '??', ':heart:' => '??',
            ':green_heart:' => '??', ':broken_heart:' => '??', ':heartbeat:' => '??', ':heartpulse:' => '??',
            ':two_hearts:' => '??', ':revolving_hearts:' => '??', ':cupid:' => '??', ':sparkling_heart:' => '??',
            ':sparkles:' => '?', ':star:' => '??', ':star2:' => '??', ':dizzy:' => '??',
            ':boom:' => '??', ':collision:' => '??', ':anger:' => '??', ':exclamation:' => '??',
            ':question:' => '?', ':grey_exclamation:' => '?', ':grey_question:' => '?', ':zzz:' => '??',
            ':dash:' => '??', ':sweat_drops:' => '??', ':notes:' => '??', ':musical_note:' => '??',
            ':fire:' => '??', ':hankey:' => '??', ':poop:' => '??', ':shit:' => '??',
            ':+1:' => '??', ':thumbsup:' => '??', ':-1:' => '??', ':thumbsdown:' => '??',
            ':ok_hand:' => '??', ':punch:' => '??', ':facepunch:' => '??', ':fist:' => '?',
            ':v:' => '??', ':wave:' => '??', ':hand:' => '?', ':raised_hand:' => '?',
            ':open_hands:' => '??', ':point_up:' => '??', ':point_down:' => '??', ':point_left:' => '??',
            ':point_right:' => '??', ':raised_hands:' => '??', ':pray:' => '??', ':point_up_2:' => '??',
            ':clap:' => '??', ':muscle:' => '??', ':metal:' => '??', ':fu:' => '??',
            ':walking:' => '??', ':runner:' => '??', ':running:' => '??', ':couple:' => '??',
            ':family:' => '??', ':two_men_holding_hands:' => '??', ':two_women_holding_hands:' => '??', ':dancer:' => '??',
            ':dancers:' => '??', ':ok_woman:' => '??', ':no_good:' => '??', ':information_desk_person:' => '??',
            ':raising_hand:' => '??', ':bride_with_veil:' => '??', ':person_with_pouting_face:' => '??', ':person_frowning:' => '??',
            ':bow:' => '??', ':couple_with_heart:' => '??', ':massage:' => '??', ':haircut:' => '??',
            ':nail_care:' => '??', ':boy:' => '??', ':girl:' => '??', ':woman:' => '??',
            ':man:' => '??', ':baby:' => '??', ':older_woman:' => '??', ':older_man:' => '??',
            ':person_with_blond_hair:' => '??', ':man_with_gua_pi_mao:' => '??', ':man_with_turban:' => '??', ':construction_worker:' => '??',
            ':cop:' => '??', ':angel:' => '??', ':princess:' => '??', ':smiley_cat:' => '??',
            ':smile_cat:' => '??', ':heart_eyes_cat:' => '??', ':kissing_cat:' => '??', ':smirk_cat:' => '??',
            ':scream_cat:' => '??', ':crying_cat_face:' => '??', ':joy_cat:' => '??', ':pouting_cat:' => '??',
            ':japanese_ogre:' => '??', ':japanese_goblin:' => '??', ':see_no_evil:' => '??', ':hear_no_evil:' => '??',
            ':speak_no_evil:' => '??', ':guardsman:' => '??', ':skull:' => '??', ':feet:' => '??',
            ':lips:' => '??', ':kiss:' => '??', ':droplet:' => '??', ':ear:' => '??',
            ':eyes:' => '??', ':nose:' => '??', ':tongue:' => '??', ':love_letter:' => '??',
            ':bust_in_silhouette:' => '??', ':busts_in_silhouette:' => '??', ':speech_balloon:' => '??', ':thought_balloon:' => '??',
            ':sunny:' => '??', ':umbrella:' => '??', ':cloud:' => '??', ':snowflake:' => '??',
            ':snowman:' => '??', ':zap:' => '??', ':cyclone:' => '??', ':foggy:' => '??',
            ':ocean:' => '??', ':cat:' => '??', ':dog:' => '??', ':mouse:' => '??',
            ':hamster:' => '??', ':rabbit:' => '??', ':wolf:' => '??', ':frog:' => '??',
            ':tiger:' => '??', ':koala:' => '??', ':bear:' => '??', ':pig:' => '??',
            ':pig_nose:' => '??', ':cow:' => '??', ':boar:' => '??', ':monkey_face:' => '??',
            ':monkey:' => '??', ':horse:' => '??', ':racehorse:' => '??', ':camel:' => '??',
            ':sheep:' => '??', ':elephant:' => '??', ':panda_face:' => '??', ':snake:' => '??',
            ':bird:' => '??', ':baby_chick:' => '??', ':hatched_chick:' => '??', ':hatching_chick:' => '??',
            ':chicken:' => '??', ':penguin:' => '??', ':turtle:' => '??', ':bug:' => '??',
            ':honeybee:' => '??', ':ant:' => '??', ':beetle:' => '??', ':snail:' => '??',
            ':octopus:' => '??', ':tropical_fish:' => '??', ':fish:' => '??', ':whale:' => '??',
            ':whale2:' => '??', ':dolphin:' => '??', ':cow2:' => '??', ':ram:' => '??',
            ':rat:' => '??', ':water_buffalo:' => '??', ':tiger2:' => '??', ':rabbit2:' => '??',
            ':dragon:' => '??', ':goat:' => '??', ':rooster:' => '??', ':dog2:' => '??',
            ':pig2:' => '??', ':mouse2:' => '??', ':ox:' => '??', ':dragon_face:' => '??',
            ':blowfish:' => '??', ':crocodile:' => '??', ':dromedary_camel:' => '??', ':leopard:' => '??',
            ':cat2:' => '??', ':poodle:' => '??', ':crab' => '??', ':paw_prints:' => '??', ':bouquet:' => '??',
            ':cherry_blossom:' => '??', ':tulip:' => '??', ':four_leaf_clover:' => '??', ':rose:' => '??',
            ':sunflower:' => '??', ':hibiscus:' => '??', ':maple_leaf:' => '??', ':leaves:' => '??',
            ':fallen_leaf:' => '??', ':herb:' => '??', ':mushroom:' => '??', ':cactus:' => '??',
            ':palm_tree:' => '??', ':evergreen_tree:' => '??', ':deciduous_tree:' => '??', ':chestnut:' => '??',
            ':seedling:' => '??', ':blossom:' => '??', ':ear_of_rice:' => '??', ':shell:' => '??',
            ':globe_with_meridians:' => '??', ':sun_with_face:' => '??', ':full_moon_with_face:' => '??', ':new_moon_with_face:' => '??',
            ':new_moon:' => '??', ':waxing_crescent_moon:' => '??', ':first_quarter_moon:' => '??', ':waxing_gibbous_moon:' => '??',
            ':full_moon:' => '??', ':waning_gibbous_moon:' => '??', ':last_quarter_moon:' => '??', ':waning_crescent_moon:' => '??',
            ':last_quarter_moon_with_face:' => '??', ':first_quarter_moon_with_face:' => '??', ':moon:' => '??', ':earth_africa:' => '??',
            ':earth_americas:' => '??', ':earth_asia:' => '??', ':volcano:' => '??', ':milky_way:' => '??',
            ':partly_sunny:' => '??', ':bamboo:' => '??', ':gift_heart:' => '??', ':dolls:' => '??',
            ':school_satchel:' => '??', ':mortar_board:' => '??', ':flags:' => '??', ':fireworks:' => '??',
            ':sparkler:' => '??', ':wind_chime:' => '??', ':rice_scene:' => '??', ':jack_o_lantern:' => '??',
            ':ghost:' => '??', ':santa:' => '??', ':christmas_tree:' => '??', ':gift:' => '??',
            ':bell:' => '??', ':no_bell:' => '??', ':tanabata_tree:' => '??', ':tada:' => '??',
            ':confetti_ball:' => '??', ':balloon:' => '??', ':crystal_ball:' => '??', ':cd:' => '??',
            ':dvd:' => '??', ':floppy_disk:' => '??', ':camera:' => '??', ':video_camera:' => '??',
            ':movie_camera:' => '??', ':computer:' => '??', ':tv:' => '??', ':iphone:' => '??',
            ':phone:' => '??', ':telephone:' => '??', ':telephone_receiver:' => '??', ':pager:' => '??',
            ':fax:' => '??', ':minidisc:' => '??', ':vhs:' => '??', ':sound:' => '??',
            ':speaker:' => '??', ':mute:' => '??', ':loudspeaker:' => '??', ':mega:' => '??',
            ':hourglass:' => '??', ':hourglass_flowing_sand:' => '?', ':alarm_clock:' => '?', ':watch:' => '??',
            ':radio:' => '??', ':satellite:' => '??', ':loop:' => '?', ':mag:' => '??',
            ':mag_right:' => '??', ':unlock:' => '??', ':lock:' => '??', ':lock_with_ink_pen:' => '??',
            ':closed_lock_with_key:' => '??', ':key:' => '??', ':bulb:' => '??', ':flashlight:' => '??',
            ':high_brightness:' => '??', ':low_brightness:' => '??', ':electric_plug:' => '??', ':battery:' => '??',
            ':calling:' => '??', ':email:' => '??', ':mailbox:' => '??', ':postbox:' => '??',
            ':bath:' => '??', ':bathtub:' => '??', ':shower:' => '??', ':toilet:' => '??',
            ':wrench:' => '??', ':nut_and_bolt:' => '??', ':hammer:' => '??', ':seat:' => '??',
            ':moneybag:' => '??', ':yen:' => '??', ':dollar:' => '??', ':pound:' => '??',
            ':euro:' => '??', ':credit_card:' => '??', ':money_with_wings:' => '??', ':e-mail:' => '??',
            ':inbox_tray:' => '??', ':outbox_tray:' => '??', ':envelope:' => '??', ':incoming_envelope:' => '??',
            ':postal_horn:' => '??', ':mailbox_closed:' => '??', ':mailbox_with_mail:' => '??', ':mailbox_with_no_mail:' => '??',
            ':door:' => '??', ':smoking:' => '??', ':bomb:' => '??', ':gun:' => '??',
            ':hocho:' => '??', ':pill:' => '??', ':syringe:' => '??', ':page_facing_up:' => '??',
            ':page_with_curl:' => '??', ':bookmark_tabs:' => '??', ':bar_chart:' => '??', ':chart_with_upwards_trend:' => '??',
            ':chart_with_downwards_trend:' => '??', ':scroll:' => '??', ':clipboard:' => '??', ':calendar:' => '??',
            ':date:' => '??', ':card_index:' => '??', ':file_folder:' => '??', ':open_file_folder:' => '??',
            ':scissors:' => '??', ':pushpin:' => '??', ':paperclip:' => '??', ':black_nib:' => '??',
            ':pencil2:' => '??', ':straight_ruler:' => '??', ':triangular_ruler:' => '??', ':closed_book:' => '??',
            ':green_book:' => '??', ':blue_book:' => '??', ':orange_book:' => '??', ':notebook:' => '??',
            ':notebook_with_decorative_cover:' => '??', ':ledger:' => '??', ':books:' => '??', ':bookmark:' => '??',
            ':name_badge:' => '??', ':microscope:' => '??', ':telescope:' => '??', ':newspaper:' => '??',
            ':football:' => '??', ':basketball:' => '??', ':soccer:' => '??', ':baseball:' => '??',
            ':tennis:' => '??', ':8ball:' => '??', ':rugby_football:' => '??', ':bowling:' => '??',
            ':golf:' => '??', ':mountain_bicyclist:' => '??', ':bicyclist:' => '??', ':horse_racing:' => '??',
            ':snowboarder:' => '??', ':swimmer:' => '??', ':surfer:' => '??', ':ski:' => '??',
            ':spades:' => '??', ':hearts:' => '??', ':clubs:' => '??', ':diamonds:' => '??',
            ':gem:' => '??', ':ring:' => '??', ':trophy:' => '??', ':musical_score:' => '??',
            ':musical_keyboard:' => '??', ':violin:' => '??', ':space_invader:' => '??', ':video_game:' => '??',
            ':black_joker:' => '??', ':flower_playing_cards:' => '??', ':game_die:' => '??', ':dart:' => '??',
            ':mahjong:' => '???', ':clapper:' => '??', ':memo:' => '??', ':pencil:' => '??',
            ':book:' => '??', ':art:' => '??', ':microphone:' => '??', ':headphones:' => '??',
            ':trumpet:' => '??', ':saxophone:' => '??', ':guitar:' => '??', ':shoe:' => '??',
            ':sandal:' => '??', ':high_heel:' => '??', ':lipstick:' => '??', ':boot:' => '??',
            ':shirt:' => '??', ':tshirt:' => '??', ':necktie:' => '??', ':womans_clothes:' => '??',
            ':dress:' => '??', ':running_shirt_with_sash:' => '??', ':jeans:' => '??', ':kimono:' => '??',
            ':bikini:' => '??', ':ribbon:' => '??', ':tophat:' => '??', ':crown:' => '??',
            ':womans_hat:' => '??', ':mans_shoe:' => '??', ':closed_umbrella:' => '??', ':briefcase:' => '??',
            ':handbag:' => '??', ':pouch:' => '??', ':purse:' => '??', ':eyeglasses:' => '??',
            ':fishing_pole_and_fish:' => '??', ':coffee:' => '??', ':tea:' => '??', ':sake:' => '??',
            ':baby_bottle:' => '??', ':beer:' => '??', ':beers:' => '??', ':cocktail:' => '??',
            ':tropical_drink:' => '??', ':wine_glass:' => '??', ':fork_and_knife:' => '??', ':pizza:' => '??',
            ':hamburger:' => '??', ':fries:' => '??', ':poultry_leg:' => '??', ':meat_on_bone:' => '??',
            ':spaghetti:' => '??', ':curry:' => '??', ':fried_shrimp:' => '??', ':bento:' => '??',
            ':sushi:' => '??', ':fish_cake:' => '??', ':rice_ball:' => '??', ':rice_cracker:' => '??',
            ':rice:' => '??', ':ramen:' => '??', ':stew:' => '??', ':oden:' => '??',
            ':dango:' => '??', ':egg:' => '??', ':bread:' => '??', ':doughnut:' => '??',
            ':custard:' => '??', ':icecream:' => '??', ':ice_cream:' => '??', ':shaved_ice:' => '??',
            ':birthday:' => '??', ':cake:' => '??', ':cookie:' => '??', ':chocolate_bar:' => '??',
            ':candy:' => '??', ':lollipop:' => '??', ':honey_pot:' => '??', ':apple:' => '??',
            ':green_apple:' => '??', ':tangerine:' => '??', ':lemon:' => '??', ':cherries:' => '??',
            ':grapes:' => '??', ':watermelon:' => '??', ':strawberry:' => '??', ':peach:' => '??',
            ':melon:' => '??', ':banana:' => '??', ':pear:' => '??', ':pineapple:' => '??',
            ':sweet_potato:' => '??', ':eggplant:' => '??', ':tomato:' => '??', ':corn:' => '??',
            ':house:' => '??', ':house_with_garden:' => '??', ':school:' => '??', ':office:' => '??',
            ':post_office:' => '??', ':hospital:' => '??', ':bank:' => '??', ':convenience_store:' => '??',
            ':love_hotel:' => '??', ':hotel:' => '??', ':wedding:' => '??', ':church:' => '??',
            ':department_store:' => '??', ':european_post_office:' => '??', ':city_sunrise:' => '??', ':city_sunset:' => '??',
            ':japanese_castle:' => '??', ':european_castle:' => '??', ':tent:' => '??', ':factory:' => '??',
            ':tokyo_tower:' => '??', ':japan:' => '??', ':mount_fuji:' => '??', ':sunrise_over_mountains:' => '??',
            ':sunrise:' => '??', ':stars:' => '??', ':statue_of_liberty:' => '??', ':bridge_at_night:' => '??',
            ':carousel_horse:' => '??', ':rainbow:' => '??', ':ferris_wheel:' => '??', ':fountain:' => '??',
            ':roller_coaster:' => '??', ':ship:' => '??', ':speedboat:' => '??', ':boat:' => '??',
            ':sailboat:' => '??', ':rowboat:' => '??', ':anchor:' => '??', ':rocket:' => '??',
            ':airplane:' => '??', ':helicopter:' => '??', ':steam_locomotive:' => '??', ':tram:' => '??',
            ':mountain_railway:' => '??', ':bike:' => '??', ':aerial_tramway:' => '??', ':suspension_railway:' => '??',
            ':mountain_cableway:' => '??', ':tractor:' => '??', ':blue_car:' => '??', ':oncoming_automobile:' => '??',
            ':car:' => '??', ':red_car:' => '??', ':taxi:' => '??', ':oncoming_taxi:' => '??',
            ':articulated_lorry:' => '??', ':bus:' => '??', ':oncoming_bus:' => '??', ':rotating_light:' => '??',
            ':police_car:' => '??', ':oncoming_police_car:' => '??', ':fire_engine:' => '??', ':ambulance:' => '??',
            ':minibus:' => '??', ':truck:' => '??', ':train:' => '??', ':station:' => '??',
            ':train2:' => '??', ':bullettrain_front:' => '??', ':bullettrain_side:' => '??', ':light_rail:' => '??',
            ':monorail:' => '??', ':railway_car:' => '??', ':trolleybus:' => '??', ':ticket:' => '??',
            ':fuelpump:' => '??', ':vertical_traffic_light:' => '??', ':traffic_light:' => '??', ':warning:' => '??',
            ':construction:' => '??', ':beginner:' => '??', ':atm:' => '??', ':slot_machine:' => '??',
            ':busstop:' => '??', ':barber:' => '??', ':hotsprings:' => '??', ':checkered_flag:' => '??',
            ':crossed_flags:' => '??', ':izakaya_lantern:' => '??', ':moyai:' => '??', ':circus_tent:' => '??',
            ':performing_arts:' => '??', ':round_pushpin:' => '??', ':triangular_flag_on_post:' => '??', ':jp:' => '????',
            ':kr:' => '????', ':cn:' => '????', ':us:' => '????', ':fr:' => '????',
            ':es:' => '????', ':it:' => '????', ':ru:' => '????', ':gb:' => '????',
            ':uk:' => '????', ':de:' => '????', ':one:' => '1??', ':two:' => '2??',
            ':three:' => '3??', ':four:' => '4??', ':five:' => '5??', ':six:' => '6??',
            ':seven:' => '7??', ':eight:' => '8??', ':nine:' => '9??', ':keycap_ten:' => '??',
            ':1234:' => '??', ':zero:' => '0??', ':hash:' => '#??', ':symbols:' => '??',
            ':arrow_backward:' => '??', ':arrow_down:' => '??', ':arrow_forward:' => '??', ':arrow_left:' => '??',
            ':capital_abcd:' => '??', ':abcd:' => '??', ':abc:' => '??', ':arrow_lower_left:' => '??',
            ':arrow_lower_right:' => '??', ':arrow_right:' => '??', ':arrow_up:' => '??', ':arrow_upper_left:' => '??',
            ':arrow_upper_right:' => '??', ':arrow_double_down:' => '?', ':arrow_double_up:' => '?', ':arrow_down_small:' => '??',
            ':arrow_heading_down:' => '??', ':arrow_heading_up:' => '??', ':leftwards_arrow_with_hook:' => '??', ':arrow_right_hook:' => '??',
            ':left_right_arrow:' => '??', ':arrow_up_down:' => '??', ':arrow_up_small:' => '??', ':arrows_clockwise:' => '??',
            ':arrows_counterclockwise:' => '??', ':rewind:' => '?', ':fast_forward:' => '?', ':information_source:' => '??',
            ':ok:' => '??', ':twisted_rightwards_arrows:' => '??', ':repeat:' => '??', ':repeat_one:' => '??',
            ':new:' => '??', ':top:' => '??', ':up:' => '??', ':cool:' => '??',
            ':free:' => '??', ':ng:' => '??', ':cinema:' => '??', ':koko:' => '??',
            ':signal_strength:' => '??', ':u5272:' => '??', ':u5408:' => '??', ':u55b6:' => '??',
            ':u6307:' => '???', ':u6708:' => '???', ':u6709:' => '??', ':u6e80:' => '??',
            ':u7121:' => '???', ':u7533:' => '??', ':u7a7a:' => '??', ':u7981:' => '??',
            ':sa:' => '???', ':restroom:' => '??', ':mens:' => '??', ':womens:' => '??',
            ':baby_symbol:' => '??', ':no_smoking:' => '??', ':parking:' => '???', ':wheelchair:' => '??',
            ':metro:' => '??', ':baggage_claim:' => '??', ':accept:' => '??', ':wc:' => '??',
            ':potable_water:' => '??', ':put_litter_in_its_place:' => '??', ':secret:' => '??', ':congratulations:' => '??',
            ':m:' => '??', ':passport_control:' => '??', ':left_luggage:' => '??', ':customs:' => '??',
            ':ideograph_advantage:' => '??', ':cl:' => '??', ':sos:' => '??', ':id:' => '??',
            ':no_entry_sign:' => '??', ':underage:' => '??', ':no_mobile_phones:' => '??', ':do_not_litter:' => '??',
            ':non-potable_water:' => '??', ':no_bicycles:' => '??', ':no_pedestrians:' => '??', ':children_crossing:' => '??',
            ':no_entry:' => '??', ':eight_spoked_asterisk:' => '??', ':eight_pointed_black_star:' => '??', ':heart_decoration:' => '??',
            ':vs:' => '??', ':vibration_mode:' => '??', ':mobile_phone_off:' => '??', ':chart:' => '??',
            ':currency_exchange:' => '??', ':aries:' => '??', ':taurus:' => '??', ':gemini:' => '??',
            ':cancer:' => '??', ':leo:' => '??', ':virgo:' => '??', ':libra:' => '??',
            ':scorpius:' => '??', ':sagittarius:' => '??', ':capricorn:' => '??', ':aquarius:' => '??',
            ':pisces:' => '??', ':ophiuchus:' => '?', ':six_pointed_star:' => '??', ':negative_squared_cross_mark:' => '?',
            ':a:' => '???', ':b:' => '???', ':ab:' => '??', ':o2:' => '???',
            ':diamond_shape_with_a_dot_inside:' => '??', ':recycle:' => '??', ':end:' => '??', ':on:' => '??',
            ':soon:' => '??', ':clock1:' => '??', ':clock130:' => '??', ':clock10:' => '??',
            ':clock1030:' => '??', ':clock11:' => '??', ':clock1130:' => '??', ':clock12:' => '??',
            ':clock1230:' => '??', ':clock2:' => '??', ':clock230:' => '??', ':clock3:' => '??',
            ':clock330:' => '??', ':clock4:' => '??', ':clock430:' => '??', ':clock5:' => '??',
            ':clock530:' => '??', ':clock6:' => '??', ':clock630:' => '??', ':clock7:' => '??',
            ':clock730:' => '??', ':clock8:' => '??', ':clock830:' => '??', ':clock9:' => '??',
            ':clock930:' => '??', ':heavy_dollar_sign:' => '??', ':copyright:' => '©?', ':registered:' => '®?',
            ':tm:' => '™?', ':x:' => '?', ':heavy_exclamation_mark:' => '??', ':bangbang:' => '??',
            ':interrobang:' => '??', ':o:' => '??', ':heavy_multiplication_x:' => '??', ':heavy_plus_sign:' => '?',
            ':heavy_minus_sign:' => '?', ':heavy_division_sign:' => '?', ':white_flower:' => '??', ':100:' => '??',
            ':heavy_check_mark:' => '??', ':ballot_box_with_check:' => '??', ':radio_button:' => '??', ':link:' => '??',
            ':curly_loop:' => '?', ':wavy_dash:' => '??', ':part_alternation_mark:' => '??', ':trident:' => '??',
            ':white_check_mark:' => '?', ':black_square_button:' => '??', ':white_square_button:' => '??', ':black_circle:' => '??',
            ':white_circle:' => '??', ':red_circle:' => '??', ':large_blue_circle:' => '??', ':large_blue_diamond:' => '??',
            ':large_orange_diamond:' => '??', ':small_blue_diamond:' => '??', ':small_orange_diamond:' => '??', ':small_red_triangle:' => '??',
            ':small_red_triangle_down:' => '??', ':black_small_square:' => '??', ':black_medium_small_square:' => '?', ':black_medium_square:' => '??',
            ':black_large_square:' => '?', ':white_small_square:' => '??', ':white_medium_small_square:' => '?', ':white_medium_square:' => '??',
            ':white_large_square:' => '?',
        ];

        if (preg_match('/^(:)([^: ]*?)(:)/', $excerpt['text'], $matches)) {
            return [
                'extent' => strlen($matches[0]),
                'element' => [
                    'text' => str_replace(array_keys($emojiMap), $emojiMap, $matches[0]),
                ],
            ];
        }
    }

    // Inline Marks

    protected function inlineMark($excerpt)
    {
        if (preg_match('/^(==)([^=]*?)(==)/', $excerpt['text'], $matches)) {
            return [
                'extent' => strlen($matches[0]),
                'element' => [
                    'name' => 'mark',
                    'text' => $matches[2],
                ],
            ];
        }
    }

    // Inline Keystrokes

    protected function inlineKeystrokes($excerpt)
    {
        if (preg_match('/^(?<!\[)(?:\[\[([^\[\]]*|[\[\]])\]\])(?!\])/s', $excerpt['text'], $matches)) {
            return [
                'extent' => strlen($matches[0]),
                'element' => [
                    'name' => 'kbd',
                    'text' => $matches[1],
                ],
            ];
        }
    }

    // Inline Superscript

    protected function inlineSuperscript($excerpt)
    {
        if (preg_match('/(?:\^(?!\^)([^\^ ]*)\^(?!\^))/', $excerpt['text'], $matches)) {
            return [
                'extent' => strlen($matches[0]),
                'element' => [
                    'name' => 'sup',
                    'text' => $matches[1],
                    'function' => 'lineElements',
                ],
            ];
        }
    }

    // Inline Subscript

    protected function inlineSubscript($excerpt)
    {
        if (preg_match('/(?:~(?!~)([^~ ]*)~(?!~))/', $excerpt['text'], $matches)) {
            return [
                'extent' => strlen($matches[0]),
                'element' => [
                    'name' => 'sub',
                    'text' => $matches[1],
                    'function' => 'lineElements',
                ],
            ];
        }
    }

    // Inline typographer

    protected function inlineTypographer($excerpt)
    {
        $substitutions = [
            '/\(c\)/i' => '&copy;',
            '/\(r\)/i' => '&reg;',
            '/\(tm\)/i' => '&trade;',
            '/\(p\)/i' => '&para;',
            '/\+-/i' => '&plusmn;',
            '/\.{4,}|\.{2}/i' => '...',
            '/\!\.{3,}/i' => '!..',
            '/\?\.{3,}/i' => '?..',
        ];

        if (preg_match('/\+-|\(p\)|\(tm\)|\(r\)|\(c\)|\.{2,}|\!\.{3,}|\?\.{3,}/i', $excerpt['text'], $matches)) {
            return [
                'extent' => strlen($matches[0]),
                'element' => [
                    'rawHtml' => preg_replace(array_keys($substitutions), array_values($substitutions), $matches[0]),
                ],
            ];
        }
    }

    // Inline Smartypants

    protected function inlineSmartypants($excerpt)
    {
        // Substitutions
        $backtickDoublequoteOpen = $this->options['smarty']['substitutions']['left-double-quote'] ?? '&ldquo;';
        $backtickDoublequoteClose = $this->options['smarty']['substitutions']['right-double-quote'] ?? '&rdquo;';

        $smartDoublequoteOpen = $this->options['smarty']['substitutions']['left-double-quote'] ?? '&ldquo;';
        $smartDoublequoteClose = $this->options['smarty']['substitutions']['right-double-quote'] ?? '&rdquo;';
        $smartSinglequoteOpen = $this->options['smarty']['substitutions']['left-single-quote'] ?? '&lsquo;';
        $smartSinglequoteClose = $this->options['smarty']['substitutions']['right-single-quote'] ?? '&rsquo;';

        $leftAngleQuote = $this->options['smarty']['substitutions']['left-angle-quote'] ?? '&laquo;';
        $rightAngleQuote = $this->options['smarty']['substitutions']['right-angle-quote'] ?? '&raquo;';

        if (preg_match('/(``)(?!\s)([^"\'`]{1,})(\'\')|(\")(?!\s)([^\"]{1,})(\")|(\')(?!\s)([^\']{1,})(\')|(<{2})(?!\s)([^<>]{1,})(>{2})|(\.{3})|(-{3})|(-{2})/i', $excerpt['text'], $matches)) {
            $matches = array_values(array_filter($matches));

            // Smart backticks
            $smartBackticks = $this->options['smarty']['smart_backticks'] ?? false;

            if ($smartBackticks) {
                if ('``' === $matches[1]) {
                    $length = strlen(trim($excerpt['before']));
                    if ($length > 0) {
                        return;
                    }

                    return [
                        'extent' => strlen($matches[0]),
                        'element' => [
                            'text' => html_entity_decode($backtickDoublequoteOpen).$matches[2].html_entity_decode($backtickDoublequoteClose),
                        ],
                    ];
                }
            }

            // Smart quotes
            $smartQuotes = $this->options['smarty']['smart_quotes'] ?? true;

            if ($smartQuotes) {
                if ("'" === $matches[1]) {
                    $length = strlen(trim($excerpt['before']));
                    if ($length > 0) {
                        return;
                    }

                    return [
                        'extent' => strlen($matches[0]),
                        'element' => [
                            'text' => html_entity_decode($smartSinglequoteOpen).$matches[2].html_entity_decode($smartSinglequoteClose),
                        ],
                    ];
                }

                if ('"' === $matches[1]) {
                    $length = strlen(trim($excerpt['before']));
                    if ($length > 0) {
                        return;
                    }

                    return [
                        'extent' => strlen($matches[0]),
                        'element' => [
                            'text' => html_entity_decode($smartDoublequoteOpen).$matches[2].html_entity_decode($smartDoublequoteClose),
                        ],
                    ];
                }
            }

            // Smart angled quotes
            $smartAngledQuotes = $this->options['smarty']['smart_angled_quotes'] ?? true;

            if ($smartAngledQuotes) {
                if ('<<' === $matches[1]) {
                    $length = strlen(trim($excerpt['before']));
                    if ($length > 0) {
                        return;
                    }

                    return [
                        'extent' => strlen($matches[0]),
                        'element' => [
                            'text' => html_entity_decode($leftAngleQuote).$matches[2].html_entity_decode($rightAngleQuote),
                        ],
                    ];
                }
            }

            // Smart dashes
            $smartDashes = $this->options['smarty']['smart_dashes'] ?? true;

            if ($smartDashes) {
                if ('---' === $matches[1]) {
                    return [
                        'extent' => strlen($matches[0]),
                        'element' => [
                            'rawHtml' => $this->options['smarty']['substitutions']['mdash'] ?? '&mdash;',
                        ],
                    ];
                }

                if ('--' === $matches[1]) {
                    return [
                        'extent' => strlen($matches[0]),
                        'element' => [
                            'rawHtml' => $this->options['smarty']['substitutions']['ndash'] ?? '&ndash;',
                        ],
                    ];
                }
            }

            // Smart ellipses
            $smartEllipses = $this->options['smarty']['smart_ellipses'] ?? true;

            if ($smartEllipses) {
                if ('...' === $matches[1]) {
                    return [
                        'extent' => strlen($matches[0]),
                        'element' => [
                            'rawHtml' => $this->options['smarty']['substitutions']['ellipses'] ?? '&hellip;',
                        ],
                    ];
                }
            }
        }
    }

    // Inline Math

    protected function inlineMath($excerpt)
    {
        $matchSingleDollar = $this->options['math']['single_dollar'] ?? false;
        // Inline Matches
        if ($matchSingleDollar) {
            // Match single dollar - experimental
            if (preg_match('/^(?<!\\\\)((?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)|(?<!\\\\\()\\\\\((.*?)(?<!\\\\\()\\\\\)(?!\\\\\)))/s', $excerpt['text'], $matches)) {
                $mathMatch = $matches[0];
            }
        } else {
            if (preg_match('/^(?<!\\\\\()\\\\\((.*?)(?<!\\\\\()\\\\\)(?!\\\\\))/s', $excerpt['text'], $matches)) {
                $mathMatch = $matches[0];
            }
        }

        if (isset($mathMatch)) {
            return [
                'extent' => strlen($mathMatch),
                'element' => [
                    'text' => $mathMatch,
                ],
            ];
        }
    }

    protected function inlineEscapeSequence($excerpt)
    {
        $element = [
            'element' => [
                'rawHtml' => $excerpt['text'][1],
            ],
            'extent' => 2,
        ];

        $state = $this->options['math'] ?? false;

        if ($state) {
            if (isset($excerpt['text'][1]) && in_array($excerpt['text'][1], $this->specialCharacters) && !preg_match('/^(?<!\\\\)(?<!\\\\\()\\\\\((.{2,}?)(?<!\\\\\()\\\\\)(?!\\\\\))/s', $excerpt['text'])) {
                return $element;
            }
        } else {
            if (isset($excerpt['text'][1]) && in_array($excerpt['text'][1], $this->specialCharacters)) {
                return $element;
            }
        }
    }

    /**
     * ------------------------------------------------------------------------
     *  Blocks.
     * ------------------------------------------------------------------------
     */
    protected function blockFootnote($line)
    {
        $state = $this->options['footnotes'] ?? true;
        if ($state) {
            return DynamicParent::blockFootnote($line);
        }
    }

    protected function blockDefinitionList($line, $block)
    {
        $state = $this->options['definition_lists'] ?? true;
        if ($state) {
            return DynamicParent::blockDefinitionList($line, $block);
        }
    }

    protected function blockCode($line, $block = null)
    {
        $codeBlock = $this->options['code']['blocks'] ?? true;
        $codeMain = $this->options['code'] ?? true;
        if ($codeBlock === true and $codeMain === true) {
            return DynamicParent::blockCode($line, $block);
        }
    }

    protected function blockComment($line)
    {
        $state = $this->options['comments'] ?? true;
        if ($state) {
            return DynamicParent::blockComment($line);
        }
    }

    protected function blockHeader($line)
    {
        $state = $this->options['headings'] ?? true;
        if (!$state) {
            return;
        }

        $block = DynamicParent::blockHeader($line);
        if (!empty($block)) {
            // Get the text of the heading
            if (isset($block['element']['handler']['argument'])) {
                $text = $block['element']['handler']['argument'];
            }

            // Get the heading level. Levels are h1, h2, ..., h6
            $level = $block['element']['name'];

            $headersAllowed = $this->options['headings']['allowed'] ?? ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            if (!in_array($level, $headersAllowed)) {
                return;
            }

            // Checks if auto generated anchors is allowed
            $autoAnchors = $this->options['headings']['auto_anchors'] ?? true;

            if ($autoAnchors) {
                // Get the anchor of the heading to link from the ToC list
                $id = $block['element']['attributes']['id'] ?? $this->createAnchorID($text);
            } else {
                // Get the anchor of the heading to link from the ToC list
                $id = $block['element']['attributes']['id'] ?? null;
            }

            // Set attributes to head tags
            $block['element']['attributes']['id'] = $id;

            $tocHeaders = $this->options['toc']['headings'] ?? ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            // Check if level are defined as a heading
            if (in_array($level, $tocHeaders)) {
                // Add/stores the heading element info to the ToC list
                $this->setContentsList([
                    'text' => $text,
                    'id' => $id,
                    'level' => $level,
                ]);
            }

            return $block;
        }
    }

    protected function blockList($line, array $CurrentBlock = null)
    {
        $state = $this->options['lists'] ?? true;
        if ($state) {
            return DynamicParent::blockList($line, $CurrentBlock);
        }
    }

    protected function blockQuote($line)
    {
        $state = $this->options['qoutes'] ?? true;
        if ($state) {
            return DynamicParent::blockQuote($line);
        }
    }

    protected function blockRule($line)
    {
        $state = $this->options['thematic_breaks'] ?? true;
        if ($state) {
            return DynamicParent::blockRule($line);
        }
    }

    protected function blockSetextHeader($line, $block = null)
    {
        $state = $this->options['headings'] ?? true;
        if (!$state) {
            return;
        }
        $block = DynamicParent::blockSetextHeader($line, $block);
        if (!empty($block)) {
            // Get the text of the heading
            if (isset($block['element']['handler']['argument'])) {
                $text = $block['element']['handler']['argument'];
            }

            // Get the heading level. Levels are h1, h2, ..., h6
            $level = $block['element']['name'];

            $headersAllowed = $this->options['headings']['allowed'] ?? ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            if (!in_array($level, $headersAllowed)) {
                return;
            }

            // Checks if auto generated anchors is allowed
            $autoAnchors = $this->options['headings']['auto_anchors'] ?? true;

            if ($autoAnchors) {
                // Get the anchor of the heading to link from the ToC list
                $id = $block['element']['attributes']['id'] ?? $this->createAnchorID($text);
            } else {
                // Get the anchor of the heading to link from the ToC list
                $id = $block['element']['attributes']['id'] ?? null;
            }

            // Set attributes to head tags
            $block['element']['attributes']['id'] = $id;

            $headersAllowed = $this->options['headings']['allowed'] ?? ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

            // Check if level are defined as a heading
            if (in_array($level, $headersAllowed)) {
                // Add/stores the heading element info to the ToC list
                $this->setContentsList([
                    'text' => $text,
                    'id' => $id,
                    'level' => $level,
                ]);
            }

            return $block;
        }
    }

    protected function blockMarkup($line)
    {
        $state = $this->options['markup'] ?? true;
        if ($state) {
            return DynamicParent::blockMarkup($line);
        }
    }

    protected function blockReference($line)
    {
        $state = $this->options['references'] ?? true;
        if ($state) {
            return DynamicParent::blockReference($line);
        }
    }

    protected function blockTable($line, $block = null)
    {
        $state = $this->options['tables'] ?? true;
        if ($state) {
            return DynamicParent::blockTable($line, $block);
        }
    }

    protected function blockAbbreviation($line)
    {
        $allowCustomAbbr = $this->options['abbreviations']['allow_custom_abbr'] ?? true;

        $state = $this->options['abbreviations'] ?? true;
        if ($state) {
            if (isset($this->options['abbreviations']['predefine'])) {
                foreach ($this->options['abbreviations']['predefine'] as $abbreviations => $description) {
                    $this->DefinitionData['Abbreviation'][$abbreviations] = $description;
                }
            }

            if ($allowCustomAbbr == true) {
                return DynamicParent::blockAbbreviation($line);
            }

            return;
        }
    }

    // Block Math

    protected function blockMath($line)
    {
        $block = [
            'element' => [
                'text' => '',
            ],
        ];

        if (preg_match('/^(?<!\\\\)(\\\\\[)(?!.)$/', $line['text'])) {
            $block['end'] = '\]';

            return $block;
        }
        if (preg_match('/^(?<!\\\\)(\$\$)(?!.)$/', $line['text'])) {
            $block['end'] = '$$';

            return $block;
        }
    }

    // ~

    protected function blockMathContinue($line, $block)
    {
        if (isset($block['complete'])) {
            return;
        }

        if (isset($block['interrupted'])) {
            $block['element']['text'] .= str_repeat(
                "\n",
                $block['interrupted']
            );

            unset($block['interrupted']);
        }

        if (preg_match('/^(?<!\\\\)(\\\\\])$/', $line['text']) && '\]' === $block['end']) {
            $block['complete'] = true;
            $block['math'] = true;
            $block['element']['text'] =
             '\\['.$block['element']['text'].'\\]';

            return $block;
        }
        if (preg_match('/^(?<!\\\\)(\$\$)$/', $line['text']) && '$$' === $block['end']) {
            $block['complete'] = true;
            $block['math'] = true;
            $block['element']['text'] = '$$'.$block['element']['text'].'$$';

            return $block;
        }

        $block['element']['text'] .= "\n".$line['body'];

        // ~

        return $block;
    }

    // ~

    protected function blockMathComplete($block)
    {
        return $block;
    }

    // Block Fenced Code

    protected function blockFencedCode($line)
    {
        $codeBlock = $this->options['code']['blocks'] ?? true;
        $codeMain = $this->options['code'] ?? true;
        if ($codeBlock === false or $codeMain === false) {
            return;
        }
        $block = DynamicParent::blockFencedCode($line);

        $marker = $line['text'][0];
        $openerLength = strspn($line['text'], $marker);
        $language = trim(
            preg_replace('/^`{3}([^\s]+)(.+)?/s', '$1', $line['text'])
        );

        $state = $this->options['diagrams'] ?? true;
        if ($state) {
            // Mermaid.js https://mermaidjs.github.io
            if ('mermaid' == strtolower($language)) {
                $element = [
                    'text' => '',
                ];

                return [
                    'char' => $marker,
                    'openerLength' => $openerLength,
                    'element' => [
                        'element' => $element,
                        'name' => 'div',
                        'attributes' => [
                            'class' => 'mermaid',
                        ],
                    ],
                ];
            }

            // Chart.js https://www.chartjs.org/
            if ('chart' == strtolower($language)) {
                $element = [
                    'text' => '',
                ];

                return [
                    'char' => $marker,
                    'openerLength' => $openerLength,
                    'element' => [
                        'element' => $element,
                        'name' => 'canvas',
                        'attributes' => [
                            'class' => 'chartjs',
                        ],
                    ],
                ];
            }
        }

        return $block;
    }

    protected function blockTableComplete(array $block)
    {
        $state = $this->options['tables']['tablespan'] ?? false;
        if ($state === false) {
            return $block;
        }

        if (!isset($block)) {
            return null;
        }

        $HeaderElements = &$block['element']['elements'][0]['elements'][0]['elements'];

        for ($index = count($HeaderElements) - 1; $index >= 0; --$index) {
            $colspan = 1;
            $HeaderElement = &$HeaderElements[$index];

            while ($index && '>' === $HeaderElements[$index - 1]['handler']['argument']) {
                ++$colspan;
                $PreviousHeaderElement = &$HeaderElements[--$index];
                $PreviousHeaderElement['merged'] = true;
                if (isset($PreviousHeaderElement['attributes'])) {
                    $HeaderElement['attributes'] = $PreviousHeaderElement['attributes'];
                }
            }

            if ($colspan > 1) {
                if (!isset($HeaderElement['attributes'])) {
                    $HeaderElement['attributes'] = [];
                }
                $HeaderElement['attributes']['colspan'] = $colspan;
            }
        }

        for ($index = count($HeaderElements) - 1; $index >= 0; --$index) {
            if (isset($HeaderElements[$index]['merged'])) {
                array_splice($HeaderElements, $index, 1);
            }
        }

        $rows = &$block['element']['elements'][1]['elements'];

        foreach ($rows as $rowNo => &$row) {
            $elements = &$row['elements'];

            for ($index = count($elements) - 1; $index >= 0; --$index) {
                $colspan = 1;
                $element = &$elements[$index];

                while ($index && '>' === $elements[$index - 1]['handler']['argument']) {
                    ++$colspan;
                    $PreviousElement = &$elements[--$index];
                    $PreviousElement['merged'] = true;
                    if (isset($PreviousElement['attributes'])) {
                        $element['attributes'] = $PreviousElement['attributes'];
                    }
                }

                if ($colspan > 1) {
                    if (!isset($element['attributes'])) {
                        $element['attributes'] = [];
                    }
                    $element['attributes']['colspan'] = $colspan;
                }
            }
        }

        foreach ($rows as $rowNo => &$row) {
            $elements = &$row['elements'];

            foreach ($elements as $index => &$element) {
                $rowspan = 1;

                if (isset($element['merged'])) {
                    continue;
                }

                while ($rowNo + $rowspan < count($rows) && $index < count($rows[$rowNo + $rowspan]['elements']) && '^' === $rows[$rowNo + $rowspan]['elements'][$index]['handler']['argument'] && (@$element['attributes']['colspan'] ?: null) === (@$rows[$rowNo + $rowspan]['elements'][$index]['attributes']['colspan'] ?: null)) {
                    $rows[$rowNo + $rowspan]['elements'][$index]['merged'] = true;
                    ++$rowspan;
                }

                if ($rowspan > 1) {
                    if (!isset($element['attributes'])) {
                        $element['attributes'] = [];
                    }
                    $element['attributes']['rowspan'] = $rowspan;
                }
            }
        }

        foreach ($rows as $rowNo => &$row) {
            $elements = &$row['elements'];

            for ($index = count($elements) - 1; $index >= 0; --$index) {
                if (isset($elements[$index]['merged'])) {
                    array_splice($elements, $index, 1);
                }
            }
        }

        return $block;
    }

    /*
    * Checkbox
    * -------------------------------------------------------------------------
    */
    protected function blockCheckbox($line)
    {
        $text = trim($line['text']);
        $beginLine = substr($text, 0, 4);
        if ('[ ] ' === $beginLine) {
            return [
                'handler' => 'checkboxUnchecked',
                'text' => substr(trim($text), 4),
            ];
        }

        if ('[x] ' === $beginLine) {
            return [
                'handler' => 'checkboxChecked',
                'text' => substr(trim($text), 4),
            ];
        }
    }

    protected function blockCheckboxContinue(array $block)
    {
        // This is here because Parsedown require it.
    }

    protected function blockCheckboxComplete(array $block)
    {
        $block['element'] = [
            'rawHtml' => $this->{$block['handler']}($block['text']),
            'allowRawHtmlInSafeMode' => true,
        ];

        return $block;
    }

    protected function checkboxUnchecked($text)
    {
        if ($this->markupEscaped || $this->safeMode) {
            $text = self::escape($text);
        }

        return '<input type="checkbox" disabled /> '.$this->format($text);
    }

    protected function checkboxChecked($text)
    {
        if ($this->markupEscaped || $this->safeMode) {
            $text = self::escape($text);
        }

        return '<input type="checkbox" checked disabled /> '.$this->format($text);
    }

    /**
     * ------------------------------------------------------------------------
     *  Helpers.
     * ------------------------------------------------------------------------.
     */

    /**
     * Formats the checkbox label without double escaping.
     */
    protected function format($text)
    {
        // backup settings
        $markupEscaped = $this->markupEscaped;
        $safeMode = $this->safeMode;

        // disable rules to prevent double escaping.
        $this->setMarkupEscaped(false);
        $this->setSafeMode(false);

        // format line
        $text = $this->line($text);

        // reset old values
        $this->setMarkupEscaped($markupEscaped);
        $this->setSafeMode($safeMode);

        return $text;
    }

    protected function parseAttributeData($attributeString)
    {
        $state = $this->options['special_attributes'] ?? true;
        if ($state) {
            return DynamicParent::parseAttributeData($attributeString);
        }

        return [];
    }

    /**
     * Encodes the ToC tag to a hashed tag and replace.
     *
     * This is used to avoid parsing user defined ToC tag which includes "_" in
     * their tag such as "[[_toc_]]". Unless it will be parsed as:
     *   "<p>[[<em>TOC</em>]]</p>"
     */
    protected function encodeTagToHash($text)
    {
        $salt = $this->getSalt();
        $tagOrigin = $this->getTagToC();

        if (strpos($text, $tagOrigin) === false) {
            return $text;
        }

        $tagHashed = hash('sha256', $salt.$tagOrigin);

        return str_replace($tagOrigin, $tagHashed, $text);
    }

    /**
     * Decodes the hashed ToC tag to an original tag and replaces.
     *
     * This is used to avoid parsing user defined ToC tag which includes "_" in
     * their tag such as "[[_toc_]]". Unless it will be parsed as:
     *   "<p>[[<em>TOC</em>]]</p>"
     */
    protected function decodeTagFromHash($text)
    {
        $salt = $this->getSalt();
        $tagOrigin = $this->getTagToC();
        $tagHashed = hash('sha256', $salt.$tagOrigin);

        if (strpos($text, $tagHashed) === false) {
            return $text;
        }

        return str_replace($tagHashed, $tagOrigin, $text);
    }

    /**
     * Unique string to use as a salt value.
     */
    protected function getSalt()
    {
        static $salt;
        if (isset($salt)) {
            return $salt;
        }

        $salt = hash('md5', time());

        return $salt;
    }

    /**
     * Gets the markdown tag for ToC.
     */
    protected function getTagToC()
    {
        return $this->options['toc']['set_toc_tag'] ?? '[toc]';
    }

    /**
     * Gets the ID attribute of the ToC for HTML tags.
     */
    protected function getIdAttributeToC()
    {
        if (isset($this->idToc) && !empty($this->idToc)) {
            return $this->idToc;
        }

        return self::ID_ATTRIBUTE_DEFAULT;
    }

    /**
     * Generates an anchor text that are link-able even if the heading is not in
     * ASCII.
     */
    protected function createAnchorID($str): string
    {
        // Make sure string is in UTF-8 and strip invalid UTF-8 characters
        $str = mb_convert_encoding((string) $str, 'UTF-8', mb_list_encodings());

        $optionUrlEncode = $this->options['toc']['urlencode'] ?? false;
        if ($optionUrlEncode) {
            // Check AnchorID is unique
            $str = $this->incrementAnchorId($str);

            return urlencode($str);
        }

        $charMap = [
            // Latin
            'À' => 'A', 'Á' => 'A', 'Â' => 'A', 'Ã' => 'A', 'Ä' => 'A', 'Å' => 'AA', 'Æ' => 'AE', 'Ç' => 'C',
            'È' => 'E', 'É' => 'E', 'Ê' => 'E', 'Ë' => 'E', 'Ì' => 'I', 'Í' => 'I', 'Î' => 'I', 'Ï' => 'I',
            'Ð' => 'D', 'Ñ' => 'N', 'Ò' => 'O', 'Ó' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ö' => 'O', 'O' => 'O',
            'Ø' => 'OE', 'Ù' => 'U', 'Ú' => 'U', 'Û' => 'U', 'Ü' => 'U', 'U' => 'U', 'Ý' => 'Y', 'Þ' => 'TH',
            'ß' => 'ss',
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'aa', 'æ' => 'ae', 'ç' => 'c',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e', 'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ð' => 'd', 'ñ' => 'n', 'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'o' => 'o',
            'ø' => 'oe', 'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u', 'u' => 'u', 'ý' => 'y', 'þ' => 'th',
            'ÿ' => 'y',

            // Latin symbols
            '©' => '(c)', '®' => '(r)', '™' => '(tm)',

            // Greek
            '?' => 'A', '?' => 'B', 'G' => 'G', '?' => 'D', '?' => 'E', '?' => 'Z', '?' => 'H', 'T' => '8',
            '?' => 'I', '?' => 'K', '?' => 'L', '?' => 'M', '?' => 'N', '?' => '3', '?' => 'O', '?' => 'P',
            '?' => 'R', 'S' => 'S', '?' => 'T', '?' => 'Y', 'F' => 'F', '?' => 'X', '?' => 'PS', 'O' => 'W',
            '?' => 'A', '?' => 'E', '?' => 'I', '?' => 'O', '?' => 'Y', '?' => 'H', '?' => 'W', '?' => 'I',
            '?' => 'Y',
            'a' => 'a', 'ß' => 'b', '?' => 'g', 'd' => 'd', 'e' => 'e', '?' => 'z', '?' => 'h', '?' => '8',
            '?' => 'i', '?' => 'k', '?' => 'l', 'µ' => 'm', '?' => 'n', '?' => '3', '?' => 'o', 'p' => 'p',
            '?' => 'r', 's' => 's', 't' => 't', '?' => 'y', 'f' => 'f', '?' => 'x', '?' => 'ps', '?' => 'w',
            '?' => 'a', '?' => 'e', '?' => 'i', '?' => 'o', '?' => 'y', '?' => 'h', '?' => 'w', '?' => 's',
            '?' => 'i', '?' => 'y', '?' => 'y', '?' => 'i',

            // Turkish
            'S' => 'S', 'I' => 'I', 'G' => 'G',
            's' => 's', 'i' => 'i', 'g' => 'g',

            // Russian
            '?' => 'A', '?' => 'B', '?' => 'V', '?' => 'G', '?' => 'D', '?' => 'E', '?' => 'Yo', '?' => 'Zh',
            '?' => 'Z', '?' => 'I', '?' => 'J', '?' => 'K', '?' => 'L', '?' => 'M', '?' => 'N', '?' => 'O',
            '?' => 'P', '?' => 'R', '?' => 'S', '?' => 'T', '?' => 'U', '?' => 'F', '?' => 'H', '?' => 'C',
            '?' => 'Ch', '?' => 'Sh', '?' => 'Sh', '?' => '', '?' => 'Y', '?' => '', '?' => 'E', '?' => 'Yu',
            '?' => 'Ya',
            '?' => 'a', '?' => 'b', '?' => 'v', '?' => 'g', '?' => 'd', '?' => 'e', '?' => 'yo', '?' => 'zh',
            '?' => 'z', '?' => 'i', '?' => 'j', '?' => 'k', '?' => 'l', '?' => 'm', '?' => 'n', '?' => 'o',
            '?' => 'p', '?' => 'r', '?' => 's', '?' => 't', '?' => 'u', '?' => 'f', '?' => 'h', '?' => 'c',
            '?' => 'ch', '?' => 'sh', '?' => 'sh', '?' => '', '?' => 'y', '?' => '', '?' => 'e', '?' => 'yu',
            '?' => 'ya',

            // Ukrainian
            '?' => 'Ye', '?' => 'I', '?' => 'Yi', '?' => 'G',
            '?' => 'ye', '?' => 'i', '?' => 'yi', '?' => 'g',

            // Czech
            'C' => 'C', 'D' => 'D', 'E' => 'E', 'N' => 'N', 'R' => 'R', 'Š' => 'S', 'T' => 'T', 'U' => 'U',
            'Ž' => 'Z',
            'c' => 'c', 'd' => 'd', 'e' => 'e', 'n' => 'n', 'r' => 'r', 'š' => 's', 't' => 't', 'u' => 'u',
            'ž' => 'z',

            // Polish
            'A' => 'A', 'C' => 'C', 'E' => 'e', 'L' => 'L', 'N' => 'N', 'S' => 'S', 'Z' => 'Z',
            'Z' => 'Z',
            'a' => 'a', 'c' => 'c', 'e' => 'e', 'l' => 'l', 'n' => 'n', 's' => 's', 'z' => 'z',
            'z' => 'z',

            // Latvian
            'A' => 'A', 'E' => 'E', 'G' => 'G', 'I' => 'i', 'K' => 'k', 'L' => 'L', 'N' => 'N', 'U' => 'u',
            'a' => 'a', 'e' => 'e', 'g' => 'g', 'i' => 'i', 'k' => 'k', 'l' => 'l', 'n' => 'n', 'u' => 'u',
        ];

        // Transliterate characters to ASCII
        $optionTransliterate = $this->options['toc']['transliterate'] ?? false;
        if ($optionTransliterate) {
            $str = str_replace(array_keys($charMap), $charMap, $str);
        }

        // Replace non-alphanumeric characters with our delimiter
        $optionDelimiter = $this->options['toc']['delimiter'] ?? '-';
        $str = preg_replace('/[^\p{L}\p{Nd}]+/u', $optionDelimiter, $str);

        // Remove duplicate delimiters
        $str = preg_replace('/('.preg_quote($optionDelimiter, '/').'){2,}/', '$1', $str);

        // Truncate slug to max. characters
        $optionLimit = $this->options['toc']['limit'] ?? mb_strlen($str, 'UTF-8');
        $str = mb_substr($str, 0, $optionLimit, 'UTF-8');

        // Remove delimiter from ends
        $str = trim($str, $optionDelimiter);

        $urlLowercase = $this->options['toc']['lowercase'] ?? true;
        $str = $urlLowercase ? mb_strtolower($str, 'UTF-8') : $str;

        return $this->incrementAnchorId($str);
    }

    /**
     * Get only the text from a markdown string.
     * It parses to HTML once then trims the tags to get the text.
     */
    protected function fetchText($text)
    {
        return trim(strip_tags($this->line($text)));
    }

    /**
     * Set/stores the heading block to ToC list in a string and array format.
     */
    protected function setContentsList(array $Content)
    {
        // Stores as an array
        $this->setContentsListAsArray($Content);
        // Stores as string in markdown list format.
        $this->setContentsListAsString($Content);
    }

    /**
     * Sets/stores the heading block info as an array.
     */
    protected function setContentsListAsArray(array $Content)
    {
        $this->contentsListArray[] = $Content;
    }

    /**
     * Sets/stores the heading block info as a list in markdown format.
     */
    protected function setContentsListAsString(array $Content)
    {
        $text = $this->fetchText($Content['text']);
        $id = $Content['id'];
        $level = (int) trim($Content['level'], 'h');
        $link = "[{$text}](#{$id})";

        if (0 === $this->firstHeadLevel) {
            $this->firstHeadLevel = $level;
        }
        $cutIndent = $this->firstHeadLevel - 1;
        if ($cutIndent > $level) {
            $level = 1;
        } else {
            $level = $level - $cutIndent;
        }

        $indent = str_repeat('  ', $level);

        // Stores in markdown list format as below:
        // - [Header1](#Header1)
        //   - [Header2-1](#Header2-1)
        //     - [Header3](#Header3)
        //   - [Header2-2](#Header2-2)
        // ...
        $this->contentsListString .= "{$indent}- {$link}".PHP_EOL;
    }

    /**
     * Collect and count anchors in use to prevent duplicated ids. Return string
     * with incremental, numeric suffix. Also init optional blacklist of ids.
     */
    protected function incrementAnchorId($str)
    {
        // add blacklist to list of used anchors
        if (!$this->isBlacklistInitialized) {
            $this->initBlacklist();
        }

        $this->anchorDuplicates[$str] = !isset($this->anchorDuplicates[$str]) ? 0 : ++$this->anchorDuplicates[$str];

        $newStr = $str;

        if ($count = $this->anchorDuplicates[$str]) {
            $newStr .= "-{$count}";

            // increment until conversion doesn't produce new duplicates anymore
            if (isset($this->anchorDuplicates[$newStr])) {
                $newStr = $this->incrementAnchorId($str);
            } else {
                $this->anchorDuplicates[$newStr] = 0;
            }
        }

        return $newStr;
    }

    /**
     * Add blacklisted ids to anchor list.
     */
    protected function initBlacklist()
    {
        if ($this->isBlacklistInitialized) {
            return;
        }

        if (!empty($this->options['headings']['blacklist']) && is_array($this->options['headings']['blacklist'])) {
            foreach ($this->options['headings']['blacklist'] as $v) {
                if (is_string($v)) {
                    $this->anchorDuplicates[$v] = 0;
                }
            }
        }

        $this->isBlacklistInitialized = true;
    }

    protected function lineElements($text, $nonNestables = [])
    {
        $Elements = [];

        $nonNestables = (
            empty($nonNestables)
            ? []
            : array_combine($nonNestables, $nonNestables)
        );

        // $excerpt is based on the first occurrence of a marker

        while ($excerpt = strpbrk($text, $this->inlineMarkerList)) {
            $marker = $excerpt[0];

            $markerPosition = strlen($text) - strlen($excerpt);

            // Get the first char before the marker
            $beforeMarkerPosition = $markerPosition - 1;
            if ($beforeMarkerPosition >= 0) {
                $charBeforeMarker = $text[$markerPosition - 1];
            } else {
                $charBeforeMarker = '';
            }

            $Excerpt = ['text' => $excerpt, 'context' => $text, 'before' => $charBeforeMarker];

            foreach ($this->InlineTypes[$marker] as $inlineType) {
                // check to see if the current inline type is nestable in the current context

                if (isset($nonNestables[$inlineType])) {
                    continue;
                }

                $Inline = $this->{"inline{$inlineType}"}($Excerpt);

                if (!isset($Inline)) {
                    continue;
                }

                // makes sure that the inline belongs to "our" marker

                if (isset($Inline['position']) and $Inline['position'] > $markerPosition) {
                    continue;
                }

                // sets a default inline position

                if (!isset($Inline['position'])) {
                    $Inline['position'] = $markerPosition;
                }

                // cause the new element to 'inherit' our non nestables

                $Inline['element']['nonNestables'] = isset($Inline['element']['nonNestables'])
                    ? array_merge($Inline['element']['nonNestables'], $nonNestables)
                    : $nonNestables
                ;

                // the text that comes before the inline
                $unmarkedText = substr($text, 0, $Inline['position']);

                // compile the unmarked text
                $InlineText = $this->inlineText($unmarkedText);
                $Elements[] = $InlineText['element'];

                // compile the inline
                $Elements[] = $this->extractElement($Inline);

                // remove the examined text
                $text = substr($text, $Inline['position'] + $Inline['extent']);

                continue 2;
            }

            // the marker does not belong to an inline

            $unmarkedText = substr($text, 0, $markerPosition + 1);

            $InlineText = $this->inlineText($unmarkedText);
            $Elements[] = $InlineText['element'];

            $text = substr($text, $markerPosition + 1);
        }

        $InlineText = $this->inlineText($text);
        $Elements[] = $InlineText['element'];

        foreach ($Elements as &$Element) {
            if (!isset($Element['autobreak'])) {
                $Element['autobreak'] = false;
            }
        }

        return $Elements;
    }

    private function pregReplaceAssoc(array $replace, $subject)
    {
        return preg_replace(array_keys($replace), array_values($replace), $subject);
    }
}