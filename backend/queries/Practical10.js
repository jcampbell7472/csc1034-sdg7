//Task 2

//Activity 3

const employee = {
name: "Matthew",
age: 18,
jobRole: "Sales Assistant"
};

console.log(employee.name);

employee.salary = 5000;

console.log(employee);


//Actitivty 4 

const scores = [12, 18, 21, 15, 30];

let totalScores = 0;

for (const score of scores) {
    total += score;
}

let averageScore = total / scores.length;

console.log(`Total Score: ${total}`);
console.log(`Average Score: ${averageScore}`);

//Activity 5

const marks = [71, 38, 65, 81, 49]

const getGrade = (mark) => {
switch (true) {
    case (mark >= 70):
        return "Distinction";
    case (mark >= 50):
        return "Pass";
    default: 
    return "Fail";
};
}

for (let i = 0; i < marks.length; i++) {
    const currentMark = marks[i];
    const result = getGrade(currentMark);
    console.log(`Mark: ${currentMark} | Grade: ${result}`);
}