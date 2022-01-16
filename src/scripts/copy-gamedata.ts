/* eslint-disable */
// @ts-nocheck

import fs from "fs";
import path from "path";
import enCharacterTable from "../../ArknightsGameData/en_US/gamedata/excel/character_table.json";
import cnCharacterTable from "../../ArknightsGameData/zh_CN/gamedata/excel/character_table.json";
import enSkillTable from "../../ArknightsGameData/en_US/gamedata/excel/skill_table.json";
import cnSkillTable from "../../ArknightsGameData/zh_CN/gamedata/excel/skill_table.json";
import enUniequipTable from "../../ArknightsGameData/en_US/gamedata/excel/uniequip_table.json";
import cnUniequipTable from "../../ArknightsGameData/zh_CN/gamedata/excel/uniequip_table.json";
import rangeTable from "../../ArknightsGameData/en_US/gamedata/excel/range_table.json";
import jetSkillTranslations from "./jet-tls/skills.json";
import jetTalentTranslations from "./jet-tls/talents.json";
import jetTraitTranslations from "./jet-tls/traits.json";
import { Character, SkillAtLevel } from "./gamedata-types";
import {
  descriptionToHtml,
  InterpolatedValue,
} from "../utils/description-parser";

const dataDir = path.join(__filename, "../../data");
const jetSkillDescriptionRegex =
  /{{(?<tagName>[^}]+)}(:(?<formatString>[0-9.%f]+))?}/;
const fixJetSkillDescriptionTags = (description: string): string => {
  let newDescription = description;
  // need to convert tag formatting used in Jet's TL json data
  // from e.g. {{attack@atk_scale}:.0%} to {attack@atk_scale:0%}
  // to match formatting used in skill_table.json
  let match: RegExpMatchArray | null = null;
  do {
    match = jetSkillDescriptionRegex.exec(newDescription);
    if (match?.groups) {
      const { tagName, formatString } = match.groups;

      let newFormatString: string | null = null;
      if (formatString === ".0%") {
        newFormatString = "0%";
      } else if (formatString === ".0f") {
        newFormatString = null;
      } else if (formatString != null) {
        newFormatString = formatString;
      }

      newDescription = newDescription.replace(
        jetSkillDescriptionRegex,
        `{${tagName}${newFormatString ? `:${newFormatString}` : ""}}`
      );
    }
  } while (match);
  return newDescription;
};

const NAME_OVERRIDES: Record<string, string> = {
  "THRM-EX": "Thermal-EX",
};

const EXCLUDED_BRANCHES: Set<String> = new Set([
  "notchar1",
  "notchar2",
  "none1",
  "none2",
]);

// These are translations of the branches in CN that are out, but are not yet
// added to EN.
const CN_BRANCH_TLS: Record<String, String> = {
  fortress: "Fortress",
  wandermedic: "Wandering",
  craftsman: "Artificer",
};
const TRAIT_OVERRIDES: Record<string, string> = {
  musha:
    "Can't be healed by other units. Recovers <@ba.kw>30/50/70</> (scales with elite promotion) self HP every time this operator attacks an enemy",
  chain:
    'Attacks deal <@ba.kw>Arts damage</> and jump between <@ba.kw>3</> (<@ba.kw>4</> at Elite 2) enemies (jump range is <@ba.kw>1.7</> tiles). Each jump deals 15% less damage and inflicts an <@ba.kw>80%</> <span class="skill-tooltip">Slow</span> for <@ba.kw>0.5</> seconds',
  phalanx:
    "Normally <@ba.kw>does not attack</>, but has <@ba.kw>+200%</> DEF and <@ba.kw>+20</> RES; When skill is active, attacks deal <@ba.kw>AoE Arts damage</>",
  geek: "Continually loses <@ba.kw>3%</> max HP per second",
  wandermedic:
    "Restores the HP of allies\nRecovers <@ba.dt.element>Elemental damage</> equal to <@ba.kw>{ep_heal_ratio:0%}</> of Attack Power</br>(Can heal <@ba.dt.element>Elemental damage</> of unhurt units)",
  slower:
    'Deals <@ba.kw>Arts damage</> and <span class="skill-tooltip">Slows</span> the target by <@ba.kw>80%</> for <@ba.kw>0.8</> seconds',
  splashcaster:
    "Deals <@ba.kw>AOE Arts damage</> with a splash radius of <@ba.kw>1.1</> tiles",
  bombarder:
    "Attacks deal <@ba.kw>two instances</> of Physical damage to <@ba.kw>ground</> enemies in a <@ba.kw>0.9</> tile area (The second instance is a shockwave that has half the normal ATK)",
  aoesniper:
    "Deals <@ba.kw>AOE Physical damage</> with a splash radius of <@ba.kw>1.0</> tiles",
  fortress:
    "Prioritize <@ba.kw>Long range splash attack</> (splash radius of <@ba.kw>1.0</> tiles) when not blocking",
  funnel:
    "Controls a <@ba.kw>Drone</> that deals <@ba.kw>Arts damage</>; When the Drone continuously attacks the same enemy, its damage will increase (from 10% up to 110% of the operator's ATK, linearly)",
};

const useNameOverride = (name: string) => NAME_OVERRIDES[name] ?? name;

(() => {
  const enCharacterIds = new Set(Object.keys(enCharacterTable));
  const cnOnlyCharacters = Object.entries(cnCharacterTable).filter(
    ([charId]) => !enCharacterIds.has(charId)
  );

  const summonIdToOperatorName: Record<string, string> = {};
  const denormalizedCharacters = (
    [...Object.entries(enCharacterTable), ...cnOnlyCharacters] as [
      string,
      Character
    ][]
  )
    .filter(([_, character]) => character.profession !== "TRAP")
    .map(([charId, character], i) => {
      const isCnOnly = !enCharacterIds.has(charId);
      const characterName = useNameOverride(
        isCnOnly ? character.appellation : character.name
      );

      character.skills
        .filter((skill) => skill.overrideTokenKey != null)
        .forEach((skill) => {
          summonIdToOperatorName[skill.overrideTokenKey!] = characterName;
        });

      const phases = character.phases.map((phase) => ({
        ...phase,
        range: phase.rangeId
          ? rangeTable[phase.rangeId as keyof typeof rangeTable]
          : null,
      }));

      const talents = (character.talents || []).map((talent, talentIndex) => {
        const candidates = (talent.candidates || []).map(
          (candidate, phaseIndex) => {
            const baseCandidateObject = {
              ...candidate,
              range: candidate.rangeId
                ? rangeTable[candidate.rangeId as keyof typeof rangeTable]
                : null,
            };
            if (isCnOnly && character.profession !== "TOKEN") {
              try {
                const talentTL =
                  jetTalentTranslations[
                    charId as keyof typeof jetTalentTranslations
                  ][talentIndex][phaseIndex];
                baseCandidateObject.name = talentTL.name;
                baseCandidateObject.description = talentTL.desc;
              } catch {
                console.warn(
                  `No translation found for: character ${charId}, talent index ${talentIndex}, phase index ${phaseIndex}`
                );
              }
            }
            return baseCandidateObject;
          }
        );
        return { ...talent, candidates };
      });

      const skillData = character.skills
        .map((skill) => {
          const skillId = skill.skillId;
          if (!skillId) {
            return null;
          }
          const baseSkillObject = isCnOnly
            ? cnSkillTable[skillId as keyof typeof cnSkillTable]
            : enSkillTable[skillId as keyof typeof enSkillTable];
          const levels = baseSkillObject.levels.map(
            (skillAtLevel: SkillAtLevel, levelIndex) => {
              const baseSkillLevelObject = {
                ...skillAtLevel,
                range: skillAtLevel.rangeId
                  ? rangeTable[skillAtLevel.rangeId as keyof typeof rangeTable]
                  : null,
              };
              if (isCnOnly && character.profession !== "TOKEN") {
                try {
                  const skillTL =
                    jetSkillTranslations[
                      skillId as keyof typeof jetSkillTranslations
                    ];
                  baseSkillLevelObject.name = skillTL.name;
                  baseSkillLevelObject.description = fixJetSkillDescriptionTags(
                    skillTL.desc[levelIndex]
                  );
                } catch {
                  console.warn(
                    `No translation found for: skill ${skillId}, level index ${levelIndex}`
                  );
                }
              }
              return baseSkillLevelObject;
            }
          );
          return {
            ...baseSkillObject,
            levels,
          };
        })
        .filter((skillData) => !!skillData);

      const { name: cnName, subProfessionId } =
        cnCharacterTable[charId as keyof typeof cnCharacterTable];

      if (character.tokenKey) {
        summonIdToOperatorName[character.tokenKey] = characterName;
      }

      return {
        ...character,
        charId,
        phases,
        talents,
        skillData,
        cnName,
        subProfessionId,
        name: useNameOverride(
          isCnOnly ? character.appellation : character.name
        ),
        isCnOnly,
        fileIndex: i,
      };
    });
  const denormalizedOperators = denormalizedCharacters.filter(
    (character) => character.profession !== "TOKEN"
  );
  fs.writeFileSync(
    path.join(dataDir, "operators.json"),
    JSON.stringify(denormalizedOperators, null, 2)
  );

  const denormalizedSummons = denormalizedCharacters
    .filter((character) => character.profession === "TOKEN")
    .map((summon) => ({
      ...summon,
      operatorName: summonIdToOperatorName[summon.charId],
    }));
  fs.writeFileSync(
    path.join(dataDir, "summons.json"),
    JSON.stringify(denormalizedSummons, null, 2)
  );

  const denormalizedSkills = Object.entries(enSkillTable).map(([_, skill]) => {
    const levels = skill.levels.map((level) => ({
      ...level,
      range: level.rangeId
        ? rangeTable[level.rangeId as keyof typeof rangeTable]
        : null,
    }));
    return {
      ...skill,
      levels,
    };
  });
  fs.writeFileSync(
    path.join(dataDir, "skills.json"),
    JSON.stringify(denormalizedSkills, null, 2)
  );

  const enSubProfessions = new Set(Object.keys(enUniequipTable.subProfDict));
  const cnOnlySubProfessions = new Set(
    Object.keys(cnUniequipTable.subProfDict).filter(
      (subprof) => !enSubProfessions.has(subprof)
    )
  );
  const denormalizedBranchesAndTraits = Object.fromEntries(
    [...cnOnlySubProfessions, ...enSubProfessions]
      .filter((name) => !EXCLUDED_BRANCHES.has(name))
      .map((subprof) => {
        // Parse trait description for operator
        const firstOp = denormalizedOperators.find(
          (op) => op.subProfessionId === subprof && op.rarity > 1 // no robots
        );

        let description = firstOp.description;
        const trait = firstOp.trait;

        // left in console.log comments - useful for debugging bad trait descriptions
        // console.log(description);
        if (subprof in TRAIT_OVERRIDES) {
          description = TRAIT_OVERRIDES[subprof];
        } else if (description in jetTraitTranslations.full) {
          // console.log("in descs");
          description = fixJetSkillDescriptionTags(
            jetTraitTranslations.full[description].en
          );
        }

        const blackboard: InterpolatedValue[] = trait
          ? trait.candidates[trait.candidates.length - 1].blackboard
          : [];

        const isCnOnly = cnOnlySubProfessions.has(subprof);
        if (isCnOnly) {
          if (!(subprof in CN_BRANCH_TLS))
            console.warn(
              "CN only branch without translation found: " + subprof
            );
          return [
            subprof,
            {
              subclassName: CN_BRANCH_TLS[subprof],
              trait: descriptionToHtml(description, blackboard),
            },
          ];
        }

        return [
          subprof,
          {
            subclassName:
              enUniequipTable.subProfDict[subprof].subProfessionName,
            trait: descriptionToHtml(description, blackboard),
          },
        ];
      })
  );
  fs.writeFileSync(
    path.join(dataDir, "branches.json"),
    JSON.stringify(denormalizedBranchesAndTraits, null, 2)
  );
})();
