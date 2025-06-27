// scripts/nutrition.js

/**
 * Calculates Body Mass Index (BMI).
 * @param {number} weightInKg - Weight in kilograms.
 * @param {number} heightInCm - Height in centimeters.
 * @returns {number} BMI value.
 */
export function calculateBMI(weightInKg, heightInCm) {
    if (heightInCm <= 0) return 0;
    const heightInMeters = heightInCm / 100;
    return weightInKg / (heightInMeters * heightInMeters);
}

/**
 * Determines BMI category based on BMI value.
 * @param {number} bmi - The calculated BMI value.
 * @returns {string} BMI category.
 */
export function getBMICategory(bmi) {
    if (bmi < 18.5) {
        return 'Underweight';
    } else if (bmi >= 18.5 && bmi < 24.9) {
        return 'Healthy Weight';
    } else if (bmi >= 25 && bmi < 29.9) {
        return 'Overweight';
    } else if (bmi >= 30) {
        return 'Obese';
    }
    return 'N/A';
}

/**
 * Calculates macro grams based on total calories and percentages.
 * @param {number} totalCalories - Total daily calorie goal.
 * @param {number} proteinRatio - Protein percentage (e.g., 30 for 30%).
 * @param {number} carbsRatio - Carbohydrate percentage (e.g., 50 for 50%).
 * @param {number} fatsRatio - Fat percentage (e.g., 20 for 20%).
 * @param {boolean} isPercentage - True if ratios are percentages, false if grams.
 * @returns {object} Object with protein, carbs, and fats in grams.
 */
export function calculateMacrosFromCalories(totalCalories, proteinRatio, carbsRatio, fatsRatio, isPercentage = false) {
    const caloriesPerGramProtein = 4;
    const caloriesPerGramCarbs = 4;
    const caloriesPerGramFats = 9;

    let proteinGrams, carbsGrams, fatsGrams;

    if (isPercentage) {
        proteinGrams = (totalCalories * (proteinRatio / 100)) / caloriesPerGramProtein;
        carbsGrams = (totalCalories * (carbsRatio / 100)) / caloriesPerGramCarbs;
        fatsGrams = (totalCalories * (fatsRatio / 100)) / caloriesPerGramFats;
    } else {
        // If not percentage, assume direct grams are provided for display but we still need to calculate if needed
        proteinGrams = proteinRatio;
        carbsGrams = carbsRatio;
        fatsGrams = fatsRatio;
    }

    return {
        protein: proteinGrams,
        carbs: carbsGrams,
        fats: fatsGrams
    };
}
