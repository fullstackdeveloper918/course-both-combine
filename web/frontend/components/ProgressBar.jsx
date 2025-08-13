import { useEffect, useState } from "react";
import { Line } from 'rc-progress';

export default function ProgressBar({data}) {

//   const [users, setUsers] = useState([]);
const [progress, setProgress] = useState(10);

useEffect(() => {
  if (!data) {
    let currentProgress = 20;

    const interval = setInterval(() => {
      if (currentProgress < 100) {
        currentProgress += 10; 
        setProgress(currentProgress); 
      } else {
        clearInterval(interval); 
      }
    }, 500); 

    return () => clearInterval(interval); 
  }
}, [data]);

  return (
    <div>
        <Line percent={progress} strokeWidth={0.2} strokeColor="black" trailWidth={0.2} trailColor="#f1f2f4" />
    </div>
  );
}
 