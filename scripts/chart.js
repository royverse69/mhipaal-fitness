// scripts/chart.js

// Function to destroy existing chart instance
export function destroyChart(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
}

// Global default options for all Chart.js charts
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = getComputedStyle(document.body).color; // Set default chart color based on body text color

// Listen for dark mode changes to update chart colors
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMediaQuery.addEventListener('change', () => {
    Chart.defaults.color = getComputedStyle(document.body).color;
    // You would typically re-render charts here or update their options directly
    // This is handled by renderDashboard etc. in app.js
});


// Update Calories Chart (Dashboard)
export function updateCaloriesChart(canvasId, consumed, burned, goal, existingChart) {
    destroyChart(existingChart);

    const ctx = document.getElementById(canvasId).getContext('2d');
    const remaining = Math.max(0, goal - consumed + burned); // Remaining calories to reach goal, accounting for burned

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Consumed', 'Burned', 'Remaining'],
            datasets: [{
                data: [consumed, burned, remaining],
                backgroundColor: ['#3B82F6', '#F59E0B', '#E2E8F0'], // blue, orange, light gray
                hoverBackgroundColor: ['#2563EB', '#D97706', '#CBD5E0'],
                borderColor: getComputedStyle(document.body).backgroundColor, // Match body background
                borderWidth: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed + ' kcal';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update Macros Charts (Dashboard)
export function updateMacrosCharts(proteinCanvasId, proteinPercentage, carbsCanvasId, carbsPercentage, fatsCanvasId, fatsPercentage, existingProteinChart, existingCarbsChart, existingFatsChart) {
    destroyChart(existingProteinChart);
    destroyChart(existingCarbsChart);
    destroyChart(existingFatsChart);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += context.parsed.toFixed(0) + '%';
                        }
                        return label;
                    }
                }
            }
        }
    };

    const createMacroChart = (canvasId, percentage, color) => {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Consumed', 'Remaining'],
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: [color, '#E2E8F0'], // specific color, light gray
                    hoverBackgroundColor: [color, '#CBD5E0'],
                    borderColor: getComputedStyle(document.body).backgroundColor,
                    borderWidth: 3,
                }]
            },
            options: commonOptions
        });
    };

    const newProteinChart = createMacroChart(proteinCanvasId, proteinPercentage, '#F97316'); // Orange
    const newCarbsChart = createMacroChart(carbsCanvasId, carbsPercentage, '#22C55E'); // Green
    const newFatsChart = createMacroChart(fatsCanvasId, fatsPercentage, '#A855F7'); // Purple

    return [newProteinChart, newCarbsChart, newFatsChart];
}

// Update Steps Chart (Dashboard)
export function updateStepsChart(canvasId, walked, goal, existingChart) {
    destroyChart(existingChart);

    const ctx = document.getElementById(canvasId).getContext('2d');
    const remaining = Math.max(0, goal - walked);

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Walked', 'Remaining'],
            datasets: [{
                data: [walked, remaining],
                backgroundColor: ['#10B981', '#E2E8F0'], // Green, light gray
                hoverBackgroundColor: ['#047857', '#CBD5E0'],
                borderColor: getComputedStyle(document.body).backgroundColor,
                borderWidth: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed.toLocaleString() + ' steps';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Create or Update Weight Chart (Dashboard & Fitness Page)
export function createOrUpdateWeightChart(canvasId, weightHistory, goalWeight, existingChart, unit) {
    destroyChart(existingChart);

    const ctx = document.getElementById(canvasId).getContext('2d');

    const labels = weightHistory.map(entry => {
        const date = new Date(entry.date);
        return `${date.getMonth() + 1}/${date.getDate()}`; // M/D format
    });
    const data = weightHistory.map(entry => entry.weight);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Weight (${unit})`,
                data: data,
                borderColor: '#6D28D9', // Deep Purple
                backgroundColor: 'rgba(109, 40, 217, 0.2)',
                tension: 0.3,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#6D28D9',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }, {
                label: `Goal (${unit})`,
                data: Array(labels.length).fill(goalWeight),
                borderColor: '#10B981', // Green
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                hoverBorderColor: 'transparent',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.body).color, // Ensure legend labels are visible
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y + ` ${unit}`;
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: getComputedStyle(document.body).color, // X-axis labels
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: getComputedStyle(document.body).classList.contains('dark-mode') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' // Grid lines
                    },
                    ticks: {
                        color: getComputedStyle(document.body).color, // Y-axis labels
                    }
                }
            }
        }
    });
}

// Update Meal Calories Chart (Nutrition Analysis)
export function updateMealCaloriesChart(canvasId, data, labels, colors, existingChart) {
    destroyChart(existingChart);

    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: getComputedStyle(document.body).backgroundColor,
                borderWidth: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: {
                    display: false, // Hidden as breakdown is displayed separately
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed + ' kcal';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update Nutrition Macros Chart (Nutrition Analysis)
export function updateNutritionMacrosChart(canvasId, proteinConsumed, proteinGoal, carbsConsumed, carbsGoal, fatsConsumed, fatsGoal, existingChart) {
    destroyChart(existingChart);

    const ctx = document.getElementById(canvasId).getContext('2d');

    const proteinPercentage = (proteinConsumed / proteinGoal) * 100;
    const carbsPercentage = (carbsConsumed / carbsGoal) * 100;
    const fatsPercentage = (fatsConsumed / fatsGoal) * 100;

    const totalPercentage = proteinPercentage + carbsPercentage + fatsPercentage; // For the overall % in the center

    const data = [
        proteinConsumed,
        carbsConsumed,
        fatsConsumed,
        Math.max(0, proteinGoal - proteinConsumed), // Remaining protein
        Math.max(0, carbsGoal - carbsConsumed), // Remaining carbs
        Math.max(0, fatsGoal - fatsConsumed), // Remaining fats
    ];

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Protein Consumed', 'Carbs Consumed', 'Fats Consumed', 'Protein Remaining', 'Carbs Remaining', 'Fats Remaining'],
            datasets: [{
                data: data,
                backgroundColor: [
                    '#F97316', // Protein Consumed (Orange)
                    '#22C55E', // Carbs Consumed (Green)
                    '#A855F7', // Fats Consumed (Purple)
                    'rgba(249, 115, 22, 0.3)', // Protein Remaining (Light Orange)
                    'rgba(34, 197, 94, 0.3)', // Carbs Remaining (Light Green)
                    'rgba(168, 85, 247, 0.3)' // Fats Remaining (Light Purple)
                ],
                borderColor: getComputedStyle(document.body).backgroundColor,
                borderWidth: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed.toFixed(1) + 'g';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}
