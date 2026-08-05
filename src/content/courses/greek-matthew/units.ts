import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Matthew, whole, as a reading path.
 *
 *   Track    Matthew            — the whole gospel
 *     Section  Chapter 1–28     — how a book is actually read
 *       Unit     two verses     — a scene
 *
 * Derived from the text's own order, as Jonah, Ruth, Esther, Mark and John are:
 * a continuous text supplies its own sequence, so there is no hand-authored
 * unit list to drift from the content.
 *
 * THE CHEAPEST GOSPEL LEFT, AND THAT IS A FACT ABOUT MARK. Matthew is 18,329
 * running words over 1,680 lemmas — 10.9 per lemma, the best ratio of any
 * remaining Gospel. Only 526 of those lemmas needed writing, because Mark, John
 * and 1 John already gloss 1,154 of them. Luke is the same size and needs 934:
 * Matthew overlaps Mark heavily where Luke carries a large vocabulary of its
 * own. When John was added, Luke looked like the obvious next book; afterwards,
 * Matthew cost a little over half as much.
 *
 * WHERE THE COST SITS. Not evenly. Chapter 5 introduces 119 new words and
 * chapter 28 introduces eight — the Sermon on the Mount and the parables of
 * chapter 13 are where Matthew's own material lives, and the passion narrative
 * is almost entirely vocabulary the reader already has from Mark.
 *
 * THREE VERSES ARE ABSENT — 17:21, 18:11 and 23:14. They are not missing from
 * the import; they are absent from the critical text SBLGNT edits, being later
 * harmonising additions. Units group by the verses that EXIST, so chapter 23
 * has a unit spanning 13–15, and the subtitle shows the real range rather than
 * pretending the numbering is unbroken.
 */

const VERSES_PER_UNIT = 2;

/**
 * Scene titles, keyed by chapter then by position within it.
 *
 * Hand-written: a corpus can say which verses come next, not what happens in
 * them. Anything unnamed falls back to its verse range, so a book can ship
 * before every scene has been named.
 */
const TITLES: Record<string, string[]> = {
  "1": ["The Book of the Genealogy", "Perez, Hezron and Ram", "Boaz, Obed and Jesse", "Solomon to Asa", "Jehoshaphat to Uzziah", "The Deportation to Babylon", "Zerubbabel to Azor", "Eleazar, Matthan, Jacob", "Fourteen Generations", "Joseph Resolved to Divorce Her", "You Shall Call His Name Jesus", "God With Us", "He Called His Name Jesus"],
  "2": ["Wise Men From the East", "Herod Was Troubled", "In Bethlehem of Judea", "Search Diligently for the Child", "The Star Went Before Them", "Gold, Frankincense and Myrrh", "Flee to Egypt", "Out of Egypt I Called My Son", "Rachel Weeping for Her Children", "Those Who Sought the Child Are Dead", "He Withdrew to Galilee", "He Shall Be Called a Nazarene"],
  "3": ["John the Baptist Appears", "A Voice Crying in the Wilderness", "Confessing Their Sins", "You Brood of Vipers", "The Axe at the Root", "He Will Baptise With Fire", "Jesus Comes to Be Baptised", "The Spirit Descending as a Dove", "This Is My Beloved Son"],
  "4": ["Led Up to Be Tempted", "Not by Bread Alone", "On the Pinnacle of the Temple", "All the Kingdoms of the World", "You Shall Worship the Lord", "Angels Ministered to Him", "He Dwelt in Capernaum", "A Great Light Has Dawned", "Repent, the Kingdom Is at Hand", "Fishers of Men", "James and John Left the Boat", "Teaching, Preaching, Healing", "Great Crowds Followed Him"],
  "5": ["He Went Up on the Mountain", "Blessed Are the Poor in Spirit", "Blessed Are the Meek", "Blessed Are the Merciful", "Blessed Are the Peacemakers", "Rejoice and Be Glad", "Salt of the Earth", "Let Your Light Shine", "Not One Iota Will Pass", "Unless Your Righteousness Exceeds", "Whoever Is Angry With His Brother", "Leave Your Gift at the Altar", "Settle With Your Accuser", "Whoever Looks With Lust", "If Your Right Eye Causes You to Sin", "A Certificate of Divorce", "Do Not Swear at All", "Not by Heaven or by Earth", "Let Your Yes Be Yes", "Turn the Other Cheek", "Go the Second Mile", "Love Your Enemies", "He Makes His Sun Rise", "You Shall Be Perfect"],
  "6": ["Beware of Practising Righteousness Before Men", "Let Not Your Left Hand Know", "Pray in Secret", "Do Not Heap Up Empty Phrases", "Our Father in Heaven", "Give Us This Day Our Daily Bread", "Deliver Us From Evil", "When You Fast", "Anoint Your Head", "Treasures in Heaven", "Where Your Treasure Is", "You Cannot Serve God and Mammon", "Look at the Birds of the Air", "Consider the Lilies", "Not Even Solomon", "Do Not Be Anxious", "Seek First the Kingdom"],
  "7": ["Judge Not", "The Speck and the Beam", "Do Not Give What Is Holy to Dogs", "Ask, Seek, Knock", "Bread, Not a Stone", "The Golden Rule", "The Narrow Gate", "By Their Fruits", "A Good Tree Cannot Bear Bad Fruit", "Every Tree That Bears No Fruit", "Not Everyone Who Says Lord, Lord", "The Wise Man Built on Rock", "The Rain Fell, the Floods Came", "Great Was Its Fall", "He Taught With Authority"],
  "8": ["Lord, If You Will, You Can Cleanse Me", "Tell No One", "A Centurion Came to Him", "Only Say the Word", "I Have Not Found Such Faith", "From East and West", "Peter's Mother-in-Law", "He Healed All Who Were Sick", "He Bore Our Diseases", "Nowhere to Lay His Head", "Let the Dead Bury Their Dead", "A Great Storm on the Sea", "Why Are You Afraid?", "The Gadarene Demoniacs", "Have You Come to Torment Us?", "The Herd Rushed Down the Bank", "They Begged Him to Leave"],
  "9": ["Your Sins Are Forgiven", "Why Do You Think Evil?", "Rise, Take Up Your Bed", "The Crowds Were Afraid", "Matthew at the Tax Booth", "The Healthy Have No Need of a Physician", "I Desire Mercy, Not Sacrifice", "New Cloth on an Old Garment", "New Wine in Fresh Wineskins", "She Touched the Fringe of His Garment", "Your Faith Has Made You Well", "Not Dead but Sleeping", "He Took Her by the Hand", "Two Blind Men Followed", "According to Your Faith", "They Spread His Fame", "Never Was Anything Like This Seen", "Sheep Without a Shepherd", "The Harvest Is Plentiful"],
  "10": ["He Called His Twelve Disciples", "The Names of the Twelve", "Go to the Lost Sheep of Israel", "Freely You Received, Freely Give", "Take No Gold in Your Belts", "Find Out Who Is Worthy", "Shake the Dust From Your Feet", "Wise as Serpents, Innocent as Doves", "Dragged Before Governors and Kings", "It Will Be Given You in That Hour", "He Who Endures to the End", "A Disciple Is Not Above His Teacher", "Nothing Covered Will Not Be Revealed", "Do Not Fear Those Who Kill the Body", "Two Sparrows for a Penny", "Whoever Confesses Me Before Men", "Not Peace, but a Sword", "A Man's Enemies, His Own Household", "Whoever Does Not Take His Cross", "Whoever Finds His Life Will Lose It", "A Cup of Cold Water"],
  "11": ["John Sends From Prison", "Are You the One Who Is to Come?", "The Blind Receive Their Sight", "A Reed Shaken by the Wind", "More Than a Prophet", "The Kingdom Suffers Violence", "He Is Elijah Who Is to Come", "Children in the Marketplace", "We Played the Flute and You Did Not Dance", "A Glutton and a Drunkard", "Woe to You, Chorazin", "Capernaum Brought Down to Hades", "Hidden From the Wise, Revealed to Infants", "Come to Me, All Who Labour", "My Yoke Is Easy"],
  "12": ["Plucking Heads of Grain", "David and the Bread of the Presence", "Something Greater Than the Temple", "Lord of the Sabbath", "Is It Lawful to Heal on the Sabbath?", "A Sheep Fallen Into a Pit", "They Took Counsel Against Him", "He Ordered Them Not to Make Him Known", "Behold My Servant", "A Bruised Reed He Will Not Break", "A Blind and Mute Demoniac", "By Beelzebul He Casts Out Demons", "A Kingdom Divided", "The Kingdom Has Come Upon You", "Binding the Strong Man", "Blasphemy Against the Spirit", "The Tree Is Known by Its Fruit", "Every Careless Word", "We Wish to See a Sign", "The Sign of Jonah", "The Queen of the South", "The Unclean Spirit Returns", "His Mother and Brothers Outside", "Who Is My Mother?", "Whoever Does the Will of My Father"],
  "13": ["He Sat Beside the Sea", "A Sower Went Out to Sow", "Seed on Rocky Ground", "Seed Among Thorns", "Why Do You Speak in Parables?", "To Him Who Has, More Will Be Given", "Seeing They Do Not See", "Blessed Are Your Eyes", "Hear the Parable of the Sower", "The Evil One Snatches It Away", "The Cares of the World", "Good Soil, a Hundredfold", "An Enemy Sowed Weeds", "Let Them Grow Together", "Gather the Weeds First", "The Mustard Seed", "The Leaven in Three Measures", "What Has Been Hidden From the Foundation", "Explain the Parable of the Weeds", "The Harvest Is the End of the Age", "The Furnace of Fire", "Treasure Hidden in a Field", "The Pearl of Great Price", "The Net Thrown Into the Sea", "The Angels Will Separate", "Treasures New and Old", "Is Not This the Carpenter's Son?", "Where Did This Man Get This?", "A Prophet Without Honour"],
  "14": ["Herod Heard the Reports", "John Bound for Herodias", "The Daughter of Herodias Danced", "His Head on a Platter", "John Beheaded in Prison", "His Disciples Took the Body", "He Had Compassion on Them", "You Give Them Something to Eat", "Five Loaves and Two Fish", "All Ate and Were Satisfied", "Five Thousand Men", "He Went Up to Pray Alone", "Walking on the Sea", "Lord, Bid Me Come to You", "Peter Began to Sink", "O You of Little Faith", "Truly You Are the Son of God", "They Touched the Fringe of His Garment"],
  "15": ["Why Do Your Disciples Break Tradition?", "Honour Your Father and Mother", "You Void the Word of God", "This People Honours Me With Their Lips", "Hear and Understand", "Not What Goes Into the Mouth", "Blind Guides", "Are You Also Without Understanding?", "What Comes Out of the Mouth", "Out of the Heart Come Evil Thoughts", "A Canaanite Woman Cried Out", "Only to the Lost Sheep of Israel", "The Children's Bread", "Even the Dogs Eat the Crumbs", "Great Crowds Came to Him", "I Have Compassion on the Crowd", "How Many Loaves Have You?", "He Gave Thanks and Broke Them", "Seven Baskets Full", "He Went to Magadan"],
  "16": ["They Asked for a Sign From Heaven", "The Signs of the Times", "Beware the Leaven of the Pharisees", "You of Little Faith", "Do You Not Remember the Loaves?", "The Teaching of the Pharisees", "Who Do People Say That I Am?", "You Are the Christ", "On This Rock", "The Keys of the Kingdom", "Far Be It From You, Lord", "Take Up Your Cross", "What Profit to Gain the World?", "The Son of Man Coming in Glory"],
  "17": ["Transfigured Before Them", "Let Us Make Three Tents", "A Bright Cloud Overshadowed Them", "Rise, Have No Fear", "Elijah Must Come First", "They Did Not Recognise Him", "A Man Knelt Before Him", "My Son Is an Epileptic", "O Faithless Generation", "Faith as a Grain of Mustard Seed", "The Son of Man Will Be Delivered Up", "Does Your Teacher Pay the Tax?", "The Coin in the Fish's Mouth"],
  "18": ["Who Is the Greatest?", "Unless You Become as Children", "Whoever Receives One Such Child", "Woe to the World for Temptations", "Better to Enter Life Maimed", "The Ninety-Nine on the Hills", "If Your Brother Sins Against You", "Tell It to the Church", "Whatever You Bind on Earth", "Where Two or Three Are Gathered", "Seventy Times Seven", "Ten Thousand Talents", "Have Patience With Me", "He Seized a Fellow Servant", "His Fellow Servants Were Distressed", "You Wicked Servant", "Delivered to the Jailers"],
  "19": ["He Left Galilee for Judea", "What God Has Joined Together", "Why Then Did Moses Command?", "Not Everyone Can Receive This", "Let the Children Come to Me", "What Good Deed Must I Do?", "If You Would Be Perfect", "The Eye of a Needle", "With God All Things Are Possible", "We Have Left Everything", "The Renewal of All Things", "Many Who Are First Will Be Last", "The Householder Hires Labourers", "Whatever Is Right I Will Give You", "The Eleventh Hour"],
  "20": ["Beginning With the Last", "These Last Worked One Hour", "Am I Not Allowed to Do as I Wish?", "The Last Will Be First", "Going Up to Jerusalem", "The Mother of Zebedee's Sons", "The Cup That I Drink", "It Is for Those Prepared", "The Ten Were Indignant", "Not So Among You", "A Ransom for Many", "Two Blind Men by the Roadside", "Have Mercy on Us, Son of David", "The Crowd Rebuked Them", "What Do You Want Me to Do?", "He Touched Their Eyes", "They Followed Him"],
  "21": ["Bethphage at the Mount of Olives", "Your King Comes to You", "The Disciples Did as He Directed", "Hosanna to the Son of David", "Who Is This?", "He Drove Out Those Who Sold", "A House of Prayer, a Den of Robbers", "Out of the Mouths of Infants", "He Lodged in Bethany", "The Fig Tree Withered", "Whatever You Ask in Prayer", "By What Authority?", "The Baptism of John", "We Do Not Know", "A Man Had Two Sons", "Which of the Two Did His Will?", "Tax Collectors Go In Before You", "A Householder Planted a Vineyard", "They Beat One and Killed Another", "They Will Respect My Son", "The Stone the Builders Rejected", "The Kingdom Taken From You", "They Feared the Crowds"],
  "22": ["A King Gave a Wedding Feast", "My Oxen and Fat Calves Are Killed", "They Made Light of It", "The Wedding Is Ready", "Go to the Main Roads", "The Man With No Wedding Garment", "Many Are Called, Few Chosen", "How to Entangle Him in His Talk", "Is It Lawful to Pay Taxes?", "Whose Likeness Is This?", "Render to Caesar", "The Sadducees Ask About Resurrection", "Seven Brothers, One Wife", "Whose Wife Will She Be?", "Neither the Scriptures nor the Power", "The God of the Living", "The Crowds Were Astonished", "Which Is the Great Commandment?", "Love the Lord Your God", "Love Your Neighbour as Yourself", "Whose Son Is the Christ?", "The Lord Said to My Lord", "No One Dared Ask Him Anything"],
  "23": ["Moses' Seat", "They Do Not Practise What They Preach", "Broad Phylacteries and Long Fringes", "You Are Not to Be Called Rabbi", "Call No Man Father", "The Greatest Shall Be Your Servant", "You Shut the Kingdom Against Men", "Blind Guides Who Swear by the Temple", "Which Is Greater, the Gift or the Altar?", "Whoever Swears by the Temple", "You Tithe Mint and Dill", "You Strain Out a Gnat", "Cleanse First the Inside", "Outwardly You Appear Righteous", "You Build the Tombs of the Prophets", "Fill Up the Measure of Your Fathers", "From Abel to Zechariah", "How Often Would I Have Gathered You", "Your House Is Left Desolate"],
  "24": ["Not One Stone Upon Another", "When Will These Things Be?", "See That No One Leads You Astray", "Wars and Rumours of Wars", "The Beginning of the Birth Pangs", "You Will Be Hated by All Nations", "This Gospel Preached to All Nations", "The Abomination of Desolation", "Let Him Not Come Down", "Alas for Women With Child", "Pray That Your Flight Be Not in Winter", "False Christs and False Prophets", "As the Lightning Comes From the East", "The Sun Will Be Darkened", "The Sign of the Son of Man", "From the Four Winds", "The Lesson of the Fig Tree", "Heaven and Earth Will Pass Away", "Of That Day No One Knows", "As in the Days of Noah", "One Taken, One Left", "Stay Awake, You Do Not Know the Hour", "If the Master Had Known", "The Faithful and Wise Servant", "If That Wicked Servant Says", "He Will Cut Him in Pieces"],
  "25": ["Ten Virgins Took Their Lamps", "The Foolish Took No Oil", "At Midnight There Was a Cry", "Give Us Some of Your Oil", "The Door Was Shut", "Watch Therefore", "A Man Going on a Journey", "Five Talents, Two, and One", "He Dug and Hid the Money", "Well Done, Good and Faithful Servant", "You Have Been Faithful Over a Little", "I Was Afraid and Hid Your Talent", "You Ought to Have Invested It", "To Everyone Who Has Will More Be Given", "The Son of Man on His Throne", "Sheep and Goats Separated", "I Was Hungry and You Gave Me Food", "When Did We See You Hungry?", "As You Did It to the Least of These", "Depart From Me, You Cursed", "I Was Hungry and You Gave Me Nothing", "When Did We Not Minister to You?", "Into Eternal Punishment"],
  "26": ["After Two Days the Passover", "They Plotted to Arrest Him", "An Alabaster Jar of Ointment", "Why This Waste?", "She Has Done a Beautiful Thing", "In Memory of Her", "Thirty Pieces of Silver", "Where Shall We Prepare the Passover?", "Go to a Certain Man in the City", "One of You Will Betray Me", "He Who Dipped His Hand With Me", "Is It I, Rabbi?", "This Is My Body", "This Is My Blood of the Covenant", "You Will All Fall Away", "Though They All Fall Away", "Before the Cock Crows", "Gethsemane", "My Soul Is Very Sorrowful", "Let This Cup Pass From Me", "Could You Not Watch One Hour?", "The Spirit Is Willing", "He Prayed the Same Words Again", "Sleep and Take Your Rest", "Judas Came With a Crowd", "Friend, Do What You Came to Do", "Put Your Sword Back", "Twelve Legions of Angels", "The Disciples All Fled", "Peter Followed at a Distance", "They Sought False Testimony", "Are You the Christ?", "He Has Uttered Blasphemy", "They Spat in His Face", "You Also Were With Jesus", "He Denied It With an Oath", "Your Accent Betrays You", "He Went Out and Wept Bitterly"],
  "27": ["They Bound Him and Led Him Away", "Judas Repented", "The Field of Blood", "The Price of Him Who Was Priced", "Are You the King of the Jews?", "He Gave No Answer", "The Custom of Releasing a Prisoner", "Barabbas or Jesus?", "Pilate's Wife's Dream", "Which of the Two Shall I Release?", "Let Him Be Crucified", "He Washed His Hands", "They Scourged Him", "A Crown of Thorns", "They Spat on Him", "Simon of Cyrene", "Golgotha, the Place of a Skull", "They Divided His Garments", "This Is Jesus, King of the Jews", "Two Robbers Crucified With Him", "You Who Would Destroy the Temple", "He Saved Others", "Let God Deliver Him Now", "Darkness Over All the Land", "My God, Why Have You Forsaken Me?", "A Sponge Full of Sour Wine", "The Curtain Was Torn in Two", "The Tombs Were Opened", "Truly This Was the Son of God", "Many Women Were There", "Joseph of Arimathea", "Laid in a New Tomb", "A Guard at the Sepulchre"],
  "28": ["Toward the Dawn of the First Day", "His Appearance Like Lightning", "He Is Not Here, He Has Risen", "Go Quickly and Tell His Disciples", "Jesus Met Them and Said Rejoice", "The Guards Told the Chief Priests", "Say His Disciples Stole Him", "This Story Is Still Told", "All Authority Has Been Given to Me", "I Am With You Always"],
};

const chapterOf = (passageId: string) => passageId.split("-")[1]!;

const known = new Set<string>();
const byId = new Map(words.map((w) => [w.id, w]));

/** Passages grouped into units of two, without crossing a chapter boundary. */
const groups: (typeof passages)[] = [];
for (const p of passages) {
  const last = groups[groups.length - 1];
  const sameChapter = last && chapterOf(last[0]!.id) === chapterOf(p.id);
  if (!last || !sameChapter || last.length >= VERSES_PER_UNIT) groups.push([p]);
  else last.push(p);
}

export { sections };

export const units: ContentBundle["units"] = groups.map((group, i) => {
  const id = `mt${String(i + 1).padStart(3, "0")}`;
  const chapter = chapterOf(group[0]!.id);
  const positionInChapter = groups.filter((g) => chapterOf(g[0]!.id) === chapter).indexOf(group);

  // Words first met here. A word introduced in chapter 5 is not re-taught in
  // chapter 20 — it returns through the review queue instead, which is the
  // repetition a continuous text gives for free.
  const fresh: string[] = [];
  for (const p of group) {
    for (const t of p.tokens) {
      if (t.wordId && !known.has(t.wordId) && byId.has(t.wordId)) {
        known.add(t.wordId);
        fresh.push(t.wordId);
      }
    }
  }

  const first = group[0]!.reference;
  const last = group[group.length - 1]!.reference;
  const range = first === last ? first : `${first}–${last.split(":")[1]}`;

  return {
    id,
    orderIndex: i,
    title: TITLES[chapter]?.[positionInChapter] ?? range,
    subtitle: range,
    // Every unit ends in real text — that is the whole design.
    type: "reading" as const,
    requires: i === 0 ? null : `mt${String(i).padStart(3, "0")}`,
    // Levels rise across the book so placement can grant early chapters.
    // Twenty-eight chapters over five levels, so a level is six chapters.
    placementLevel: Math.min(4, Math.ceil(Number(chapter) / 6) - 1),
    wordIds: fresh,
    // Every verse the unit covers, plus the one it ends on. Recording only the
    // milestone left half of Jonah unlocked by nothing and displayed nowhere.
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `matthew-${chapter}`,
    exercises: vocabDrills(id, fresh),
  };
});

/** Recognition drill for every new word; production for every second one. */
function vocabDrills(unitId: string, wordIds: string[]): ContentBundle["units"][number]["exercises"] {
  const out: ContentBundle["units"][number]["exercises"] = [];
  wordIds.forEach((wordId, i) => {
    out.push({
      id: `${unitId}-mc-${wordId}`,
      type: "mc_vocab",
      wordId,
      direction: "recognition",
      prompt: "What does this word mean?",
    });
    if (i % 2 === 1) {
      out.push({
        id: `${unitId}-mcp-${wordId}`,
        type: "mc_vocab",
        wordId,
        direction: "production",
        prompt: "Which word means this?",
      });
    }
  });
  return out;
}
