/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { professionToClass } from "../utils/globals";
import { operatorClassIcon, operatorImage } from "../utils/images";
import { MdStar } from "react-icons/md";
export interface OperatorInfoProps {
  operatorEntry: {
    name: string;
    appellation: string;
    profession: string;
    rarity: number;
  };
}

const OperatorInfo: React.VFC<OperatorInfoProps> = (props) => {
  const { operatorEntry } = props;
  const {
    name: cnName,
    appellation: name,
    profession,
    rarity: rawRarity,
  } = operatorEntry;
  const operatorClass = professionToClass(profession);
  const rarity = rawRarity + 1; // 0-indexed;
  return (
    <div css={styles}>
      <div className="name-and-class">
        <div className="operator-name">
          <span className="operator-name-english">{name}</span>
          <span className="operator-name-chinese" aria-hidden="true">
            {cnName}
          </span>
        </div>
        <div className="operator-class">
          <img
            className="class-icon"
            src={operatorClassIcon(operatorClass.toLowerCase())}
            alt=""
          />
          <span className="class-name">{operatorClass}</span>
        </div>
      </div>
      <div className="portrait-and-rarity">
        <img className="operator-portrait" src={operatorImage(name)} alt="" />
        <span className="rarity" aria-label={`Rarity: ${rarity} stars`}>
          {[...Array(rarity).keys()].map((i) => (
            <MdStar key={i} aria-hidden="true" />
          ))}
        </span>
      </div>
    </div>
  );
};
export default OperatorInfo;

const styles = css`
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;

  .portrait-and-rarity {
    width: 104px;
    height: 104px;
    position: relative;
    border-radius: 4px;
    border: 2px solid #fff;

    .operator-portrait {
      margin: 4px;
      width: 96px;
      height: 96px;
      background-color: #f98d3f;
      border-radius: 2px;
    }

    .rarity {
      position: absolute;
      bottom: -18px;
      left: 0;
      width: 100%;
      text-align: center;

      svg {
        fill: #232134;
        stroke: #e3e1ef;
        stroke-width: 1px;
        margin-right: -1px;
      }
    }
  }

  .name-and-class {
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding-left: 24px;

    .operator-name {
      font-size: 36px;
      font-weight: bold;
      line-height: 24px;
      margin-bottom: 16px;

      .operator-name-chinese {
        &::before {
          content: " ";
        }

        opacity: 0.2;
        font-weight: normal;
      }
    }

    .operator-class {
      display: flex;
      align-items: center;
      opacity: 0.5;

      .class-icon {
        width: 32px;
        height: 32px;
      }

      .class-name {
        margin-left: 8px;
        line-height: 32px;
      }
    }
  }
`;
