// scripts/app.js

import {
    updateCaloriesChart,
    updateMacrosCharts,
    updateStepsChart,
    updateWeightChart,
    updateMealCaloriesChart,
    updateNutritionMacrosChart,
    destroyChart,
    createOrUpdateWeightChart
} from './chart.js';
import {
    fetchNutritionData
} from './api.js';
import {
    calculateBMI,
    getBMICategory,
    calculateMacrosFromCalories
} from './nutrition.js';

// --- Global State Variables ---
let currentCaloriesChart = null;
let currentProteinChart = null;
let currentCarbsChart = null;
let currentFatsChart = null;
let currentStepsChart = null;
let currentWeightChart = null;
let currentMealCaloriesChart = null;
let currentNutritionMacrosChart = null;
let currentDailyWeightChart = null; // Chart for Exercise & Weight Tracking page

let appState = {
    darkMode: localStorage.getItem('darkMode') === 'true',
    // Dashboard Data
    calories: {
        consumed: 1500,
        burned: 300,
        goal: 1800
    },
    macros: {
        protein: {
            consumed: 245,
            goal: 300
        },
        carbs: {
            consumed: 0,
            goal: 300
        },
        fats: {
            consumed: 12,
            goal: 70
        }
    },
    water: {
        consumed: 32,
        goal: 64
    },
    steps: {
        walked: 7550,
        goal: 10000
    },
    exercise: {
        time: 30,
        calories: 350,
        entries: [] // Stores logged workouts
    },
    weight: {
        current: 70, // kg
        history: [{
            date: '2025-05-28',
            weight: 72
        }, {
            date: '2025-06-05',
            weight: 71
        }, {
            date: '2025-06-12',
            weight: 70.5
        }, {
            date: '2025-06-19',
            weight: 70
        }], // {date: 'YYYY-MM-DD', weight: value}
        goal: 65, // kg
        height: 170 // cm (assuming for BMI calculation)
    },
    // Meal Logging Data
    meals: {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
        Snacks: []
    },
    currentMealCategory: 'Breakfast', // Tracks which meal category is active for adding food
    // User Settings
    settings: {
        calorieLimit: 2000,
        macroRatioType: 'gram', // 'gram' or 'percent'
        macroGoals: { // Based on gram initially
            protein: 150,
            carbs: 250,
            fats: 60
        },
        stepTarget: 10000,
        waterTarget: 64, // oz
        unitWeight: 'kg', // 'kg' or 'lbs'
        unitEnergy: 'kcal', // 'kcal' or 'kj'
        reminders: {
            meals: true,
            water: false
        }
    }
};

// Load state from localStorage
function loadState() {
    const savedState = localStorage.getItem('fitTrackAppState');
    if (savedState) {
        appState = JSON.parse(savedState);
    }
    // Ensure default settings are applied if not loaded or if new settings are added
    appState.settings = { ...appState.settings,
        ...{
            calorieLimit: 2000,
            macroRatioType: 'gram',
            macroGoals: {
                protein: 150,
                carbs: 250,
                fats: 60
            },
            stepTarget: 10000,
            waterTarget: 64,
            unitWeight: 'kg',
            unitEnergy: 'kcal',
            reminders: {
                meals: true,
                water: false
            }
        },
        ...appState.settings
    };

    // Initialize darkMode from localStorage preference
    if (appState.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('dark-mode-toggle').querySelector('i').classList.replace('fa-moon', 'fa-sun');
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('dark-mode-toggle').querySelector('i').classList.replace('fa-sun', 'fa-moon');
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('fitTrackAppState', JSON.stringify(appState));
}

// --- UI Utility Functions ---

// Show a specific page and hide others
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.remove('hidden');
    document.getElementById(pageId).classList.add('active');

    // Update active state for bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add('text-blue-600');
            item.classList.remove('text-gray-500');
        } else {
            item.classList.remove('text-blue-600');
            item.classList.add('text-gray-500');
        }
    });

    // Re-render charts when page is shown
    renderDashboard();
    renderNutritionAnalysis();
    renderExerciseWeightTracking(); // Ensure weight chart is updated
    renderUserSettings(); // Ensure settings are loaded
}

// Show modal
function showModal(modalId) {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById(modalId).classList.remove('hidden');
}

// Hide modal
function hideModal(modalId) {
    document.getElementById('modal-backdrop').classList.add('hidden');
    document.getElementById(modalId).classList.add('hidden');
}

// Display generic message box
function showMessageBox(title, message) {
    document.getElementById('message-box-title').textContent = title;
    document.getElementById('message-box-text').textContent = message;
    showModal('message-box-modal');
}

// --- Render Functions ---

function renderDashboard() {
    const {
        calories,
        macros,
        water,
        steps,
        exercise,
        weight
    } = appState;
    const {
        calorieLimit,
        stepTarget,
        waterTarget,
        unitWeight
    } = appState.settings;

    // Calories Chart
    document.getElementById('calories-consumed-display').textContent = calories.consumed;
    document.getElementById('calories-consumed-val').textContent = calories.consumed;
    document.getElementById('calories-burned-val').textContent = calories.burned;
    document.getElementById('calories-goal-val').textContent = calorieLimit;
    currentCaloriesChart = updateCaloriesChart('caloriesChart', calories.consumed, calories.burned, calorieLimit, currentCaloriesChart);

    // Macros Charts (only if macros are visible)
    if (!document.getElementById('macros-chart-container').classList.contains('hidden')) {
        document.getElementById('protein-consumed-display').textContent = `${macros.protein.consumed}g`;
        document.getElementById('carbs-consumed-display').textContent = `${macros.carbs.consumed}g`;
        document.getElementById('fats-consumed-display').textContent = `${macros.fats.consumed}g`;

        document.getElementById('protein-goal-display').textContent = `${macros.protein.consumed}g / ${macros.protein.goal}g`;
        document.getElementById('carbs-goal-display').textContent = `${macros.carbs.consumed}g / ${macros.carbs.goal}g`;
        document.getElementById('fats-goal-display').textContent = `${macros.fats.consumed}g / ${macros.fats.goal}g`;

        const proteinPercentage = (macros.protein.consumed / macros.protein.goal) * 100;
        const carbsPercentage = (macros.carbs.consumed / macros.carbs.goal) * 100;
        const fatsPercentage = (macros.fats.consumed / macros.fats.goal) * 100;

        [currentProteinChart, currentCarbsChart, currentFatsChart] = updateMacrosCharts(
            'proteinChart', proteinPercentage,
            'carbsChart', carbsPercentage,
            'fatsChart', fatsPercentage,
            currentProteinChart, currentCarbsChart, currentFatsChart
        );
    } else {
        // Destroy macro charts if hidden to save resources
        destroyChart(currentProteinChart);
        destroyChart(currentCarbsChart);
        destroyChart(currentFatsChart);
        currentProteinChart = null;
        currentCarbsChart = null;
        currentFatsChart = null;
    }

    // Water Intake
    const waterPercentage = (water.consumed / waterTarget) * 100;
    document.getElementById('water-fill').style.width = `${Math.min(100, waterPercentage)}%`;
    document.getElementById('water-display').textContent = `${water.consumed} oz / ${waterTarget} oz`;

    // Steps Walked
    document.getElementById('steps-display').textContent = steps.walked.toLocaleString();
    document.getElementById('steps-goal-display').textContent = `Goal: ${stepTarget.toLocaleString()} steps`;
    currentStepsChart = updateStepsChart('stepsChart', steps.walked, stepTarget, currentStepsChart);

    // Exercise Summary
    document.getElementById('exercise-time-display').textContent = `${exercise.time} minutes`;
    document.getElementById('exercise-calories-display').textContent = `${exercise.calories} Cals`;

    // Weight Tracking
    const bmi = calculateBMI(weight.current, weight.height);
    const bmiCategory = getBMICategory(bmi);
    document.getElementById('current-weight-val').textContent = weight.current;
    document.getElementById('bmi-display').textContent = `Current: ${weight.current} ${unitWeight}`;
    document.getElementById('bmi-status').textContent = `You have a ${bmiCategory.toLowerCase()} BMI`;

    // Weight Chart (Dashboard)
    currentWeightChart = createOrUpdateWeightChart('weightChart', weight.history, weight.goal, currentWeightChart, unitWeight);
    saveState();
}

function renderMealLogging() {
    const {
        meals
    } = appState;
    const mealEntriesContainer = document.getElementById('meal-entries');
    mealEntriesContainer.innerHTML = ''; // Clear previous entries

    // Loop through each meal category and display entries
    for (const category in meals) {
        if (meals[category].length > 0) {
            const categoryHeader = document.createElement('h3');
            categoryHeader.className = 'text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200';
            categoryHeader.textContent = category;
            mealEntriesContainer.appendChild(categoryHeader);

            // Calculate total calories and macros for the current meal category
            let totalCategoryCalories = 0;
            let totalCategoryProtein = 0;
            let totalCategoryCarbs = 0;
            let totalCategoryFats = 0;

            meals[category].forEach((food, index) => {
                totalCategoryCalories += food.calories;
                totalCategoryProtein += food.protein_g;
                totalCategoryCarbs += food.carbohydrates_g;
                totalCategoryFats += food.fat_g;

                const foodItem = document.createElement('div');
                foodItem.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-2 flex justify-between items-center shadow-sm';
                foodItem.innerHTML = `
                    <div>
                        <p class="font-medium text-gray-900 dark:text-gray-100">${food.food_name} <span class="text-xs text-gray-500 dark:text-gray-400">(${food.serving_qty} ${food.serving_unit})</span></p>
                        <p class="text-sm text-gray-600 dark:text-gray-300">${food.calories.toFixed(0)} kcal | P: ${food.protein_g.toFixed(1)}g | C: ${food.carbohydrates_g.toFixed(1)}g | F: ${food.fat_g.toFixed(1)}g</p>
                    </div>
                    <button class="remove-food-btn text-red-500 hover:text-red-700 p-2" data-category="${category}" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
                mealEntriesContainer.appendChild(foodItem);
            });

            const categorySummary = document.createElement('div');
            categorySummary.className = 'bg-blue-100 dark:bg-blue-800 rounded-lg p-4 mb-4 text-blue-800 dark:text-blue-100 font-semibold';
            categorySummary.innerHTML = `
                <p>Total ${category}: ${totalCategoryCalories.toFixed(0)} kcal</p>
                <p class="text-sm">Macros: P ${totalCategoryProtein.toFixed(1)}g | C ${totalCategoryCarbs.toFixed(1)}g | F ${totalCategoryFats.toFixed(1)}g</p>
            `;
            mealEntriesContainer.appendChild(categorySummary);
        }
    }
    saveState();
}

function renderNutritionAnalysis() {
    const {
        meals,
        settings
    } = appState;
    const {
        calorieLimit,
        macroGoals
    } = settings;

    let totalConsumedCalories = 0;
    let totalConsumedProtein = 0;
    let totalConsumedCarbs = 0;
    let totalConsumedFats = 0;

    const mealCalorieData = [];
    const mealCalorieLabels = [];
    const mealCalorieColors = [];
    const predefinedColors = ['#f97316', '#22c55e', '#a855f7', '#06b6d4']; // orange, green, purple, cyan

    let colorIndex = 0;

    for (const category in meals) {
        let categoryCalories = 0;
        meals[category].forEach(food => {
            categoryCalories += food.calories;
            totalConsumedCalories += food.calories;
            totalConsumedProtein += food.protein_g;
            totalConsumedCarbs += food.carbohydrates_g;
            totalConsumedFats += food.fat_g;
        });
        if (categoryCalories > 0) {
            mealCalorieData.push(categoryCalories);
            mealCalorieLabels.push(category);
            mealCalorieColors.push(predefinedColors[colorIndex % predefinedColors.length]);
            colorIndex++;
        }
    }

    // Calories Analysis Tab
    const remainingCalories = calorieLimit - totalConsumedCalories + appState.calories.burned;
    const caloriesPercentage = (totalConsumedCalories / calorieLimit) * 100;
    document.getElementById('total-calories-percent').textContent = `${caloriesPercentage.toFixed(0)}%`;
    currentMealCaloriesChart = updateMealCaloriesChart('mealCaloriesChart', mealCalorieData, mealCalorieLabels, mealCalorieColors, currentMealCaloriesChart);

    const mealCalorieBreakdownContainer = document.getElementById('meal-calorie-breakdown');
    mealCalorieBreakdownContainer.innerHTML = ''; // Clear previous
    mealCalorieLabels.forEach((label, index) => {
        const percentage = (mealCalorieData[index] / totalConsumedCalories) * 100;
        const item = document.createElement('div');
        item.className = 'flex items-center';
        item.innerHTML = `
            <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${mealCalorieColors[index]};"></div>
            <span>${label} <span class="text-gray-600">(${percentage.toFixed(0)}%, ${mealCalorieData[index].toFixed(0)} cal)</span></span>
        `;
        mealCalorieBreakdownContainer.appendChild(item);
    });

    document.getElementById('analysis-total-calories').textContent = calorieLimit.toFixed(0);
    document.getElementById('analysis-consumed-calories').textContent = totalConsumedCalories.toFixed(0);
    document.getElementById('analysis-burned-calories').textContent = appState.calories.burned.toFixed(0);


    // Macros Analysis Tab
    const proteinRemaining = Math.max(0, macroGoals.protein - totalConsumedProtein);
    const carbsRemaining = Math.max(0, macroGoals.carbs - totalConsumedCarbs);
    const fatsRemaining = Math.max(0, macroGoals.fats - totalConsumedFats);

    const proteinPercentage = (totalConsumedProtein / macroGoals.protein) * 100;
    const carbsPercentage = (totalConsumedCarbs / macroGoals.carbs) * 100;
    const fatsPercentage = (totalConsumedFats / macroGoals.fats) * 100;

    const totalPercentage = proteinPercentage + carbsPercentage + fatsPercentage; // For the overall % in the center

    document.getElementById('analysis-protein-val').textContent = `${totalConsumedProtein.toFixed(0)}g / ${macroGoals.protein.toFixed(0)}g`;
    document.getElementById('analysis-carbs-val').textContent = `${totalConsumedCarbs.toFixed(0)}g / ${macroGoals.carbs.toFixed(0)}g`;
    document.getElementById('analysis-fats-val').textContent = `${totalConsumedFats.toFixed(0)}g / ${macroGoals.fats.toFixed(0)}g`;

    document.getElementById('analysis-protein-bar').style.width = `${Math.min(100, proteinPercentage)}%`;
    document.getElementById('analysis-carbs-bar').style.width = `${Math.min(100, carbsPercentage)}%`;
    document.getElementById('analysis-fats-bar').style.width = `${Math.min(100, fatsPercentage)}%`;

    // Update the macro donut chart on the Nutrition Analysis page
    currentNutritionMacrosChart = updateNutritionMacrosChart('nutritionMacrosChart',
        totalConsumedProtein, macroGoals.protein,
        totalConsumedCarbs, macroGoals.carbs,
        totalConsumedFats, macroGoals.fats,
        currentNutritionMacrosChart
    );
    saveState();
}

function renderExerciseWeightTracking() {
    const {
        weight
    } = appState;
    const {
        unitWeight
    } = appState.settings;

    // Weight chart for this section
    currentDailyWeightChart = createOrUpdateWeightChart('dailyWeightChart', weight.history, weight.goal, currentDailyWeightChart, unitWeight);

    const bmi = calculateBMI(weight.current, weight.height);
    const bmiCategory = getBMICategory(bmi);
    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    document.getElementById('bmi-risk').textContent = bmiCategory;

    // Apply color based on BMI category
    const bmiRiskElement = document.getElementById('bmi-risk');
    bmiRiskElement.classList.remove('text-green-600', 'text-orange-500', 'text-red-600');
    if (bmiCategory.includes('healthy')) {
        bmiRiskElement.classList.add('text-green-600');
    } else if (bmiCategory.includes('Underweight') || bmiCategory.includes('Overweight')) {
        bmiRiskElement.classList.add('text-orange-500');
    } else if (bmiCategory.includes('Obese')) {
        bmiRiskElement.classList.add('text-red-600');
    }
    saveState();
}

function renderUserSettings() {
    const {
        settings
    } = appState;

    // Set daily goals inputs
    document.getElementById('calorie-limit-input').value = settings.calorieLimit;
    document.getElementById('step-target-input').value = settings.stepTarget;
    document.getElementById('water-target-input').value = settings.waterTarget;

    // Macro Ratios display
    if (settings.macroRatioType === 'gram') {
        document.getElementById('macro-gram-btn').classList.add('bg-blue-500', 'text-white');
        document.getElementById('macro-gram-btn').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('macro-percent-btn').classList.remove('bg-blue-500', 'text-white');
        document.getElementById('macro-percent-btn').classList.add('bg-gray-200', 'text-gray-700');
        document.getElementById('macro-inputs-gram').classList.remove('hidden');
        document.getElementById('macro-inputs-percent').classList.add('hidden');

        document.getElementById('protein-goal-gram').value = settings.macroGoals.protein;
        document.getElementById('carbs-goal-gram').value = settings.macroGoals.carbs;
        document.getElementById('fats-goal-gram').value = settings.macroGoals.fats;
    } else {
        document.getElementById('macro-percent-btn').classList.add('bg-blue-500', 'text-white');
        document.getElementById('macro-percent-btn').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('macro-gram-btn').classList.remove('bg-blue-500', 'text-white');
        document.getElementById('macro-gram-btn').classList.add('bg-gray-200', 'text-gray-700');
        document.getElementById('macro-inputs-percent').classList.remove('hidden');
        document.getElementById('macro-inputs-gram').classList.add('hidden');

        // Convert gram goals to percentage for display if currently in gram mode,
        // or load directly if percentage mode was saved
        const {
            protein,
            carbs,
            fats
        } = calculateMacrosFromCalories(settings.calorieLimit, settings.macroGoals.protein, settings.macroGoals.carbs, settings.macroGoals.fats, settings.macroRatioType === 'percent');

        appState.settings.macroGoals.protein = protein;
        appState.settings.macroGoals.carbs = carbs;
        appState.settings.macroGoals.fats = fats;
    }

    // Unit settings
    document.getElementById('unit-weight').value = settings.unitWeight;
    document.getElementById('unit-energy').value = settings.unitEnergy;

    // Reminders
    document.getElementById('reminder-meals').checked = settings.reminders.meals;
    document.getElementById('reminder-water').checked = settings.reminders.water;
    saveState();
}

// --- Event Handlers ---

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderDashboard();
    renderMealLogging(); // Initial render for meal logging to show saved data
    renderNutritionAnalysis(); // Initial render for nutrition analysis
    renderExerciseWeightTracking();
    renderUserSettings();
    showPage('dashboard'); // Default to dashboard on load

    // Dark Mode Toggle
    document.getElementById('dark-mode-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        appState.darkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', appState.darkMode);
        const icon = document.getElementById('dark-mode-toggle').querySelector('i');
        if (appState.darkMode) {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
        // Re-render charts to apply theme changes
        renderDashboard();
        renderNutritionAnalysis();
        renderExerciseWeightTracking();
    });

    // Bottom Navigation
    document.querySelectorAll('.nav-item').forEach(button => {
        button.addEventListener('click', () => {
            showPage(button.dataset.page);
        });
    });

    // Modal Close Buttons
    document.querySelectorAll('.close-modal-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            // Find the parent modal and hide it
            const modal = event.target.closest('.modal-content');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });

    // Modal backdrop click to close
    document.getElementById('modal-backdrop').addEventListener('click', (event) => {
        if (event.target === event.currentTarget) { // Only close if clicking on backdrop itself
            document.querySelectorAll('.modal-content').forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    hideModal(modal.id);
                }
            });
        }
    });

    // --- Dashboard Event Listeners ---
    document.getElementById('dashboard-calories-btn').addEventListener('click', () => {
        document.getElementById('calories-chart-container').classList.remove('hidden');
        document.getElementById('macros-chart-container').classList.add('hidden');
        document.getElementById('dashboard-calories-btn').classList.add('bg-blue-500', 'text-white');
        document.getElementById('dashboard-calories-btn').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('dashboard-macros-btn').classList.remove('bg-blue-500', 'text-white');
        document.getElementById('dashboard-macros-btn').classList.add('bg-gray-200', 'text-gray-700');
        renderDashboard(); // Re-render to update chart visibility
    });

    document.getElementById('dashboard-macros-btn').addEventListener('click', () => {
        document.getElementById('calories-chart-container').classList.add('hidden');
        document.getElementById('macros-chart-container').classList.remove('hidden');
        document.getElementById('dashboard-macros-btn').classList.add('bg-blue-500', 'text-white');
        document.getElementById('dashboard-macros-btn').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('dashboard-calories-btn').classList.remove('bg-blue-500', 'text-white');
        document.getElementById('dashboard-calories-btn').classList.add('bg-gray-200', 'text-gray-700');
        renderDashboard(); // Re-render to update chart visibility
    });

    document.getElementById('water-add').addEventListener('click', () => {
        appState.water.consumed += 8; // Add 8 oz
        renderDashboard();
    });

    document.getElementById('water-remove').addEventListener('click', () => {
        appState.water.consumed = Math.max(0, appState.water.consumed - 8); // Remove 8 oz, min 0
        renderDashboard();
    });

    document.getElementById('add-steps-btn').addEventListener('click', () => showModal('add-steps-modal'));
    document.getElementById('save-steps-btn').addEventListener('click', () => {
        const stepsToAdd = parseInt(document.getElementById('steps-input').value);
        if (!isNaN(stepsToAdd) && stepsToAdd > 0) {
            appState.steps.walked += stepsToAdd;
            renderDashboard();
            hideModal('add-steps-modal');
            document.getElementById('steps-input').value = ''; // Clear input
        } else {
            showMessageBox('Invalid Input', 'Please enter a valid number of steps.');
        }
    });

    document.getElementById('add-exercise-btn').addEventListener('click', () => showModal('add-exercise-modal'));
    document.getElementById('save-exercise-btn').addEventListener('click', () => { // FIX: Changed 'addEventListener(() => {' to 'addEventListener('click', () => {'
        const workoutType = document.getElementById('modal-workout-type').value;
        const customWorkoutName = document.getElementById('modal-custom-workout-name').value;
        const duration = parseInt(document.getElementById('modal-workout-duration').value);
        const caloriesBurned = parseInt(document.getElementById('modal-workout-calories').value);

        if (!isNaN(duration) && duration > 0 && !isNaN(caloriesBurned) && caloriesBurned > 0) {
            appState.exercise.time += duration;
            appState.calories.burned += caloriesBurned;
            appState.exercise.calories += caloriesBurned; // Update exercise summary calories

            const workoutName = workoutType === 'custom' ? customWorkoutName : workoutType.charAt(0).toUpperCase() + workoutType.slice(1);

            appState.exercise.entries.push({
                type: workoutName,
                duration: duration,
                calories: caloriesBurned,
                date: new Date().toISOString().split('T')[0]
            });
            renderDashboard();
            hideModal('add-exercise-modal');
            document.getElementById('modal-workout-duration').value = '';
            document.getElementById('modal-workout-calories').value = '';
            document.getElementById('modal-workout-type').value = 'running'; // Reset to default
            document.getElementById('modal-custom-workout-name-container').style.display = 'none'; // Hide custom input
            document.getElementById('modal-custom-workout-name').value = ''; // Clear custom input
        } else {
            showMessageBox('Invalid Input', 'Please enter valid duration and calories burned.');
        }
    });

    // Event listener for workout type change in modal
    document.getElementById('modal-workout-type').addEventListener('change', (event) => {
        if (event.target.value === 'custom') {
            document.getElementById('modal-custom-workout-name-container').style.display = 'block';
        } else {
            document.getElementById('modal-custom-workout-name-container').style.display = 'none';
        }
    });


    document.getElementById('add-weight-btn').addEventListener('click', () => showModal('add-weight-modal'));
    document.getElementById('save-weight-btn').addEventListener('click', () => {
        const newWeight = parseFloat(document.getElementById('modal-weight-input').value);
        if (!isNaN(newWeight) && newWeight > 0) {
            appState.weight.current = newWeight;
            appState.weight.history.push({
                date: new Date().toISOString().split('T')[0],
                weight: newWeight
            });
            renderDashboard();
            renderExerciseWeightTracking(); // Also update the weight chart on fitness page
            hideModal('add-weight-modal');
            document.getElementById('modal-weight-input').value = '';
        } else {
            showMessageBox('Invalid Input', 'Please enter a valid weight.');
        }
    });

    // --- Meal Logging Event Listeners ---
    document.querySelectorAll('.meal-category-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            // Remove active class from all buttons
            document.querySelectorAll('.meal-category-btn').forEach(btn => {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            // Add active class to the clicked button
            event.target.classList.add('bg-blue-500', 'text-white');
            event.target.classList.remove('bg-gray-200', 'text-gray-700');
            appState.currentMealCategory = event.target.dataset.category;
            saveState();
        });
    });

    document.getElementById('food-search-btn').addEventListener('click', async () => {
        const query = document.getElementById('food-search-input').value.trim();
        if (query) {
            const searchResultsContainer = document.getElementById('search-results');
            searchResultsContainer.innerHTML = '<p class="text-center text-gray-500">Searching...</p>';
            try {
                const data = await fetchNutritionData(query);
                searchResultsContainer.innerHTML = ''; // Clear loading message

                if (data && data.foods && data.foods.length > 0) {
                    data.foods.forEach(food => {
                        const foodItem = document.createElement('div');
                        foodItem.className = 'bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-2 flex justify-between items-center shadow-sm';
                        foodItem.innerHTML = `
                            <div>
                                <p class="font-medium text-blue-800 dark:text-blue-100">${food.food_name} <span class="text-xs text-blue-600 dark:text-blue-300">(${food.serving_qty} ${food.serving_unit})</span></p>
                                <p class="text-sm text-blue-700 dark:text-blue-200">${food.nf_calories.toFixed(0)} kcal | P: ${food.nf_protein.toFixed(1)}g | C: ${food.nf_total_carbohydrate.toFixed(1)}g | F: ${food.nf_total_fat.toFixed(1)}g</p>
                            </div>
                            <button class="add-food-to-meal-btn bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
                                data-food='${JSON.stringify({
                                    food_name: food.food_name,
                                    serving_qty: food.serving_qty,
                                    serving_unit: food.serving_unit,
                                    calories: food.nf_calories,
                                    protein_g: food.nf_protein,
                                    carbohydrates_g: food.nf_total_carbohydrate,
                                    fat_g: food.nf_total_fat
                                })}'>
                                <i class="fas fa-plus"></i>
                            </button>
                        `;
                        searchResultsContainer.appendChild(foodItem);
                    });
                } else {
                    searchResultsContainer.innerHTML = '<p class="text-center text-gray-500">No results found. Try a different query.</p>';
                }
            } catch (error) {
                console.error('Error fetching nutrition data:', error);
                searchResultsContainer.innerHTML = '<p class="text-center text-red-500">Error fetching data. Please try again.</p>';
            }
        } else {
            showMessageBox('Empty Search', 'Please enter a food item to search.');
        }
    });

    // Event delegation for adding food to meal
    document.getElementById('search-results').addEventListener('click', (event) => {
        if (event.target.closest('.add-food-to-meal-btn')) {
            const button = event.target.closest('.add-food-to-meal-btn');
            const foodData = JSON.parse(button.dataset.food);
            const category = appState.currentMealCategory;

            if (!appState.meals[category]) {
                appState.meals[category] = [];
            }
            appState.meals[category].push(foodData);
            appState.calories.consumed += foodData.calories;
            appState.macros.protein.consumed += foodData.protein_g;
            appState.macros.carbs.consumed += foodData.carbohydrates_g;
            appState.macros.fats.consumed += foodData.fat_g;

            renderMealLogging();
            renderDashboard(); // Update dashboard with new calorie/macro counts
            renderNutritionAnalysis(); // Update nutrition analysis
            document.getElementById('food-search-input').value = ''; // Clear search
            document.getElementById('search-results').innerHTML = ''; // Clear results
            showMessageBox('Food Added!', `${foodData.food_name} added to ${category}.`);
        }
    });

    // Event delegation for removing food from meal
    document.getElementById('meal-entries').addEventListener('click', (event) => {
        if (event.target.closest('.remove-food-btn')) {
            const button = event.target.closest('.remove-food-btn');
            const category = button.dataset.category;
            const index = parseInt(button.dataset.index);

            if (appState.meals[category] && appState.meals[category][index]) {
                const removedFood = appState.meals[category].splice(index, 1)[0];
                appState.calories.consumed -= removedFood.calories;
                appState.macros.protein.consumed -= removedFood.protein_g;
                appState.macros.carbs.consumed -= removedFood.carbohydrates_g;
                appState.macros.fats.consumed -= removedFood.fat_g;
                renderMealLogging();
                renderDashboard();
                renderNutritionAnalysis();
                showMessageBox('Food Removed', `${removedFood.food_name} removed from ${category}.`);
            }
        }
    });


    document.getElementById('add-custom-recipe-btn').addEventListener('click', () => showModal('add-custom-recipe-modal'));
    document.getElementById('save-custom-recipe-btn').addEventListener('click', () => {
        const recipeName = document.getElementById('recipe-name-input').value.trim();
        const calories = parseFloat(document.getElementById('recipe-calories-input').value);
        const protein = parseFloat(document.getElementById('recipe-protein-input').value);
        const carbs = parseFloat(document.getElementById('recipe-carbs-input').value);
        const fats = parseFloat(document.getElementById('recipe-fats-input').value);

        if (recipeName && !isNaN(calories) && !isNaN(protein) && !isNaN(carbs) && !isNaN(fats) && calories >= 0 && protein >= 0 && carbs >= 0 && fats >= 0) {
            const customRecipe = {
                food_name: recipeName,
                serving_qty: 1,
                serving_unit: 'serving',
                calories: calories,
                protein_g: protein,
                carbohydrates_g: carbs,
                fat_g: fats
            };
            const category = appState.currentMealCategory;
            if (!appState.meals[category]) {
                appState.meals[category] = [];
            }
            appState.meals[category].push(customRecipe);

            appState.calories.consumed += customRecipe.calories;
            appState.macros.protein.consumed += customRecipe.protein_g;
            appState.macros.carbs.consumed += customRecipe.carbohydrates_g;
            appState.macros.fats.consumed += customRecipe.fat_g;

            renderMealLogging();
            renderDashboard();
            renderNutritionAnalysis();
            hideModal('add-custom-recipe-modal');
            // Clear inputs
            document.getElementById('recipe-name-input').value = '';
            document.getElementById('recipe-calories-input').value = '';
            document.getElementById('recipe-protein-input').value = '';
            document.getElementById('recipe-carbs-input').value = '';
            document.getElementById('recipe-fats-input').value = '';
            showMessageBox('Custom Recipe Added!', `${recipeName} added to ${category}.`);
        } else {
            showMessageBox('Invalid Input', 'Please fill all fields with valid numbers for custom recipe.');
        }
    });

    // --- Nutrition Analysis Event Listeners ---
    document.querySelectorAll('.nutrition-tab-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            // Remove active class from all tab buttons and hide all content
            document.querySelectorAll('.nutrition-tab-btn').forEach(btn => {
                btn.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
                btn.classList.add('text-gray-600');
            });
            document.querySelectorAll('.nutrition-tab-content').forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });

            // Add active class to the clicked button and show relevant content
            event.target.classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
            event.target.classList.remove('text-gray-600');
            document.getElementById(`${event.target.dataset.tab}-analysis-tab`).classList.remove('hidden');
            document.getElementById(`${event.target.dataset.tab}-analysis-tab`).classList.add('active');
            renderNutritionAnalysis(); // Re-render to ensure charts update if tab was hidden
        });
    });

    // --- Exercise & Weight Tracking Event Listeners (on this page, not modal) ---
    document.getElementById('workout-type').addEventListener('change', (event) => {
        if (event.target.value === 'custom') {
            document.getElementById('custom-workout-name-container').style.display = 'block';
        } else {
            document.getElementById('custom-workout-name-container').style.display = 'none';
        }
    });

    document.getElementById('log-workout-btn').addEventListener('click', () => {
        const workoutType = document.getElementById('workout-type').value;
        const customWorkoutName = document.getElementById('custom-workout-name').value;
        const duration = parseInt(document.getElementById('workout-duration').value);
        const caloriesBurned = parseInt(document.getElementById('workout-calories').value);

        if (!isNaN(duration) && duration > 0 && !isNaN(caloriesBurned) && caloriesBurned > 0) {
            appState.exercise.time += duration;
            appState.calories.burned += caloriesBurned;
            appState.exercise.calories += caloriesBurned; // Update exercise summary calories

            const workoutName = workoutType === 'custom' ? customWorkoutName : workoutType.charAt(0).toUpperCase() + workoutType.slice(1);

            appState.exercise.entries.push({
                type: workoutName,
                duration: duration,
                calories: caloriesBurned,
                date: new Date().toISOString().split('T')[0]
            });
            renderDashboard(); // Update dashboard
            renderExerciseWeightTracking(); // Update this page's charts/info
            showMessageBox('Workout Logged!', `${workoutName} logged for ${duration} minutes, burning ${caloriesBurned} calories.`);
            // Clear inputs
            document.getElementById('workout-duration').value = '';
            document.getElementById('workout-calories').value = '';
            document.getElementById('workout-type').value = 'running'; // Reset to default
            document.getElementById('custom-workout-name-container').style.display = 'none'; // Hide custom input
            document.getElementById('custom-workout-name').value = ''; // Clear custom input
        } else {
            showMessageBox('Invalid Input', 'Please enter valid duration and calories burned for workout.');
        }
    });

    document.getElementById('log-body-weight-btn').addEventListener('click', () => {
        const newWeight = parseFloat(document.getElementById('body-weight-input').value);
        if (!isNaN(newWeight) && newWeight > 0) {
            appState.weight.current = newWeight;
            appState.weight.history.push({
                date: new Date().toISOString().split('T')[0],
                weight: newWeight
            });
            renderDashboard(); // Update dashboard
            renderExerciseWeightTracking(); // Update this page's charts/info
            showMessageBox('Weight Logged!', `Your weight has been updated to ${newWeight} ${appState.settings.unitWeight}.`);
            document.getElementById('body-weight-input').value = ''; // Clear input
        } else {
            showMessageBox('Invalid Input', 'Please enter a valid weight.');
        }
    });

    // --- User Settings Event Listeners ---
    document.getElementById('save-goals-btn').addEventListener('click', () => {
        appState.settings.calorieLimit = parseInt(document.getElementById('calorie-limit-input').value) || 0;
        appState.settings.stepTarget = parseInt(document.getElementById('step-target-input').value) || 0;
        appState.settings.waterTarget = parseInt(document.getElementById('water-target-input').value) || 0;

        if (appState.settings.macroRatioType === 'gram') {
            appState.settings.macroGoals.protein = parseInt(document.getElementById('protein-goal-gram').value) || 0;
            appState.settings.macroGoals.carbs = parseInt(document.getElementById('carbs-goal-gram').value) || 0;
            appState.settings.macroGoals.fats = parseInt(document.getElementById('fats-goal-gram').value) || 0;
        } else { // percentage
            const proteinPercent = parseInt(document.getElementById('protein-goal-percent').value) || 0;
            const carbsPercent = parseInt(document.getElementById('carbs-goal-percent').value) || 0;
            const fatsPercent = parseInt(document.getElementById('fats-goal-percent').value) || 0;

            if ((proteinPercent + carbsPercent + fatsPercent) !== 100) {
                showMessageBox('Macro Error', 'Protein, Carbs, and Fats percentages must add up to 100%. Please adjust.');
                return;
            }

            // Convert percentages to grams based on current calorie limit
            const {
                protein,
                carbs,
                fats
            } = calculateMacrosFromCalories(appState.settings.calorieLimit, proteinPercent, carbsPercent, fatsPercent, true);

            appState.settings.macroGoals.protein = protein;
            appState.settings.macroGoals.carbs = carbs;
            appState.settings.macroGoals.fats = fats;
        }
        saveState();
        renderDashboard();
        renderNutritionAnalysis();
        showMessageBox('Goals Saved!', 'Your daily goals have been updated.');
    });

    document.getElementById('macro-gram-btn').addEventListener('click', () => {
        appState.settings.macroRatioType = 'gram';
        renderUserSettings();
    });

    document.getElementById('macro-percent-btn').addEventListener('click', () => {
        appState.settings.macroRatioType = 'percent';
        renderUserSettings();
    });

    document.getElementById('save-units-btn').addEventListener('click', () => {
        appState.settings.unitWeight = document.getElementById('unit-weight').value;
        appState.settings.unitEnergy = document.getElementById('unit-energy').value;
        saveState();
        renderDashboard(); // Re-render to update units in UI
        renderExerciseWeightTracking();
        showMessageBox('Units Saved!', 'Your display units have been updated.');
    });

    document.getElementById('save-reminders-btn').addEventListener('click', () => {
        appState.settings.reminders.meals = document.getElementById('reminder-meals').checked;
        appState.settings.reminders.water = document.getElementById('reminder-water').checked;
        saveState();
        showMessageBox('Reminders Saved!', 'Your reminder preferences have been updated.');
    });
});
