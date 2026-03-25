#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_EMPLOYEES 100
#define FILENAME "payroll_data.dat"

typedef struct {
    int id;
    char name[50];
    float basic_salary;
    float allowances;
    float deductions;
    float net_salary;
} Employee;

Employee employees[MAX_EMPLOYEES];
int employee_count = 0;

void load_data() {
    FILE *fp = fopen(FILENAME, "rb");
    if (fp) {
        fread(&employee_count, sizeof(int), 1, fp);
        fread(employees, sizeof(Employee), employee_count, fp);
        fclose(fp);
    }
}

void save_data() {
    FILE *fp = fopen(FILENAME, "wb");
    if (fp) {
        fwrite(&employee_count, sizeof(int), 1, fp);
        fwrite(employees, sizeof(Employee), employee_count, fp);
        fclose(fp);
    }
}

void add_employee() {
    if (employee_count >= MAX_EMPLOYEES) {
        printf("Maximum employee limit reached.\n");
        return;
    }
    
    Employee new_emp;
    printf("Enter Employee ID: ");
    scanf("%d", &new_emp.id);
    
    // Check if ID exists
    for (int i = 0; i < employee_count; i++) {
        if (employees[i].id == new_emp.id) {
            printf("Employee ID already exists.\n");
            return;
        }
    }
    
    printf("Enter Name: ");
    getchar(); // consume newline left by scanf
    fgets(new_emp.name, sizeof(new_emp.name), stdin);
    new_emp.name[strcspn(new_emp.name, "\n")] = 0; // remove newline
    
    printf("Enter Basic Salary: ");
    scanf("%f", &new_emp.basic_salary);
    
    printf("Enter Allowances: ");
    scanf("%f", &new_emp.allowances);
    
    printf("Enter Deductions: ");
    scanf("%f", &new_emp.deductions);
    
    // Compute purely derived Net Salary
    new_emp.net_salary = new_emp.basic_salary + new_emp.allowances - new_emp.deductions;
    
    employees[employee_count++] = new_emp;
    save_data();
    
    printf("\nEmployee added successfully! Net Salary: %.2f\n", new_emp.net_salary);
}

void view_employees() {
    if (employee_count == 0) {
        printf("\nNo employees found.\n");
        return;
    }
    
    printf("\n--------------------------------------------------------------------------------\n");
    printf("%-5s | %-20s | %-10s | %-10s | %-10s | %-10s\n", "ID", "Name", "Basic", "Allowances", "Deductions", "Net Salary");
    printf("--------------------------------------------------------------------------------\n");
    
    for (int i = 0; i < employee_count; i++) {
        printf("%-5d | %-20s | %-10.2f | %-10.2f | %-10.2f | %-10.2f\n",
               employees[i].id, employees[i].name, employees[i].basic_salary,
               employees[i].allowances, employees[i].deductions, employees[i].net_salary);
    }
    printf("--------------------------------------------------------------------------------\n");
}

void delete_employee() {
    if (employee_count == 0) {
        printf("\nNo employees to delete.\n");
        return;
    }
    
    int id, found = 0;
    printf("Enter Employee ID to delete: ");
    scanf("%d", &id);
    
    for (int i = 0; i < employee_count; i++) {
        if (employees[i].id == id) {
            found = 1;
            // Shift elements down
            for (int j = i; j < employee_count - 1; j++) {
                employees[j] = employees[j + 1];
            }
            employee_count--;
            save_data();
            printf("\nEmployee %d deleted successfully.\n", id);
            break;
        }
    }
    
    if (!found) {
        printf("\nEmployee ID not found.\n");
    }
}

int main() {
    load_data();
    int choice;
    
    while (1) {
        printf("\n=== Employee Payroll System ===\n");
        printf("1. Add Employee\n");
        printf("2. View All Payslips\n");
        printf("3. Delete Employee\n");
        printf("4. Exit\n");
        printf("Enter your choice: ");
        
        if (scanf("%d", &choice) != 1) {
            printf("Invalid input formatting. Please try restarting.\n");
            break;
        }
        
        switch (choice) {
            case 1:
                add_employee();
                break;
            case 2:
                view_employees();
                break;
            case 3:
                delete_employee();
                break;
            case 4:
                printf("Exiting... Goodbye!\n");
                return 0;
            default:
                printf("Invalid choice. Try again.\n");
        }
    }
    
    return 0;
}
