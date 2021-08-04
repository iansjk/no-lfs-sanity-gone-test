const NextArrow: React.VFC<React.HTMLAttributes<SVGElement>> = (props) => {
  return (
    <svg
      width="72"
      height="60"
      viewBox="0 0 72 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 26C1.79086 26 3.86258e-07 27.7909 0 30C-3.86258e-07 32.2091 1.79086 34 4 34L4 26ZM70.8284 32.8284C72.3905 31.2663 72.3905 28.7337 70.8284 27.1716L45.3726 1.71574C43.8105 0.153638 41.2778 0.153638 39.7157 1.71574C38.1536 3.27783 38.1536 5.81049 39.7157 7.37259L62.3431 30L39.7157 52.6274C38.1536 54.1895 38.1536 56.7222 39.7157 58.2843C41.2778 59.8464 43.8105 59.8464 45.3726 58.2843L70.8284 32.8284ZM4 34L68 34L68 26L4 26L4 34Z"
        fill="#D6D6E2"
      />
    </svg>
  );
};
export default NextArrow;
